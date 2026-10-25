import "server-only"

import { eq } from "drizzle-orm"

import { getDb } from "@/db"
import { favoriteStations, stations } from "@/db/schema"
import type { StationFuel } from "@/lib/stations/types"

import { evaluateAlert } from "./alerts"
import { notifyUser } from "./dispatch"
import { priceDropMessage } from "./messages"

const priceOf = (s: typeof stations.$inferSelect, fuel: StationFuel) =>
  ({ gasolina95: s.priceGasolina95, gasolina98: s.priceGasolina98, diesel: s.priceDiesel, dieselPremium: s.priceDieselPremium, glp: s.priceGlp })[fuel]

/** Revisa todas las alertas activas tras una sincronización y avisa de las bajadas. */
export async function runPriceAlerts(): Promise<{ checked: number; notified: number }> {
  const db = getDb()
  const rows = await db
    .select({ fav: favoriteStations, station: stations })
    .from(favoriteStations)
    .innerJoin(stations, eq(stations.id, favoriteStations.stationId))
    .where(eq(favoriteStations.alertEnabled, true))

  const updates: { userId: string; stationId: string; price: number }[] = []
  const toNotify: { userId: string; message: ReturnType<typeof priceDropMessage> }[] = []

  for (const { fav, station } of rows) {
    const fuel = fav.fuelType as StationFuel
    const decision = evaluateAlert({ current: priceOf(station, fuel), lastSeen: fav.lastSeenPrice, threshold: fav.alertThreshold })
    if (decision.nextSeen !== null && decision.nextSeen !== fav.lastSeenPrice) {
      updates.push({ userId: fav.userId, stationId: fav.stationId, price: decision.nextSeen })
    }
    if (decision.notify && decision.reason && fav.lastSeenPrice !== null && decision.nextSeen !== null) {
      toNotify.push({
        userId: fav.userId,
        message: priceDropMessage({
          stationId: station.id, stationName: station.name, locality: station.locality, fuel,
          price: decision.nextSeen, previous: fav.lastSeenPrice, reason: decision.reason, threshold: fav.alertThreshold,
        }),
      })
    }
  }

  // La referencia se guarda antes de avisar: si un envío falla no se repite la alerta en la siguiente pasada.
  for (let i = 0; i < updates.length; i += 1000) {
    const chunk = updates.slice(i, i + 1000)
    await db.$client`
      update favorite_stations f set last_seen_price = u.price
      from unnest(${chunk.map((c) => c.userId)}::uuid[], ${chunk.map((c) => c.stationId)}::text[], ${chunk.map((c) => c.price)}::float8[])
        as u(user_id, station_id, price)
      where f.user_id = u.user_id and f.station_id = u.station_id`
  }

  let notified = 0
  for (let i = 0; i < toNotify.length; i += 5) {
    const results = await Promise.allSettled(toNotify.slice(i, i + 5).map((n) => notifyUser(n.userId, n.message)))
    notified += results.filter((r) => r.status === "fulfilled").length
    results.forEach((r) => r.status === "rejected" && console.error("notifyUser", r.reason))
  }
  return { checked: rows.length, notified }
}
