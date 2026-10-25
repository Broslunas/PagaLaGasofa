import { eq, inArray } from "drizzle-orm"
import { NextResponse } from "next/server"

import { getDb } from "@/db"
import { favoriteStations, liveShares, notifications, profiles, pushSubscriptions, tripPassengers, trips, vehicles } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { rateLimit } from "@/lib/rate-limit"

const omit = <T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> => Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key)) as Omit<T, K>

/** Copia de todos los datos del usuario en JSON (derecho de acceso y portabilidad, RGPD). Sin claves ni secretos. */
export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })
  const limit = await rateLimit(request, { name: "account-export", limit: 5, windowSec: 3600 })
  if (!limit.ok) return NextResponse.json({ error: "Demasiadas descargas. Inténtalo más tarde." }, { status: 429 })

  const db = getDb()
  const [profile, vehicleRows, tripRows, favoriteRows, notificationRows, deviceRows, liveRows] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)),
    db.select().from(vehicles).where(eq(vehicles.userId, user.id)),
    db.select().from(trips).where(eq(trips.userId, user.id)),
    db.select().from(favoriteStations).where(eq(favoriteStations.userId, user.id)),
    db.select().from(notifications).where(eq(notifications.userId, user.id)),
    db.select({ userAgent: pushSubscriptions.userAgent, createdAt: pushSubscriptions.createdAt }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id)),
    db.select({ title: liveShares.title, createdAt: liveShares.createdAt, expiresAt: liveShares.expiresAt, stoppedAt: liveShares.stoppedAt }).from(liveShares).where(eq(liveShares.userId, user.id)),
  ])
  const passengerRows = tripRows.length ? await db.select().from(tripPassengers).where(inArray(tripPassengers.tripId, tripRows.map((t) => t.id))) : []

  const body = {
    exportedAt: new Date().toISOString(),
    account: { ...profile[0], email: user.email, authCreatedAt: user.created_at },
    vehicles: vehicleRows,
    // El hash del token de gestión es un secreto: no se exporta.
    trips: tripRows.map((trip) => ({
      ...omit(trip, "manageTokenHash"),
      passengers: passengerRows.filter((p) => p.tripId === trip.id).map((p) => omit(p, "tripId")),
    })),
    favoriteStations: favoriteRows,
    notifications: notificationRows,
    pushDevices: deviceRows,
    liveSessions: liveRows,
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="pagalagasofa-datos.json"', "Cache-Control": "private, no-store" },
  })
}
