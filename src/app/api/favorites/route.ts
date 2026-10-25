import { and, eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getDb } from "@/db"
import { favoriteStations } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { getStations, listFavorites } from "@/lib/stations/queries"
import { STATION_FUELS, type StationFuel } from "@/lib/stations/types"

const bodySchema = z.object({ stationId: z.string().regex(/^\d{1,8}$/), fuelType: z.enum(STATION_FUELS).optional() })
const MAX_FAVORITES = 50
const unauthorized = () => NextResponse.json({ error: "Inicia sesión" }, { status: 401 })

export async function GET() {
  const user = await getUser()
  if (!user) return unauthorized()
  const favorites = await listFavorites(user.id)
  const byId = new Map((await getStations(favorites.map((f) => f.stationId))).map((s) => [s.id, s]))
  return NextResponse.json({
    favorites: favorites.flatMap((f) =>
      byId.has(f.stationId)
        ? [{ fuelType: f.fuelType, alertEnabled: f.alertEnabled, alertThreshold: f.alertThreshold, station: byId.get(f.stationId)! }]
        : [],
    ),
  })
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return unauthorized()
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })

  const existing = await listFavorites(user.id)
  if (existing.length >= MAX_FAVORITES && !existing.some((f) => f.stationId === parsed.data.stationId)) {
    return NextResponse.json({ error: `Máximo ${MAX_FAVORITES} favoritas` }, { status: 409 })
  }
  const exists = (await getStations([parsed.data.stationId])).length > 0
  if (!exists) return NextResponse.json({ error: "Gasolinera no encontrada" }, { status: 404 })

  await getDb()
    .insert(favoriteStations)
    .values({ userId: user.id, stationId: parsed.data.stationId, fuelType: parsed.data.fuelType ?? "gasolina95" })
    .onConflictDoUpdate({
      target: [favoriteStations.userId, favoriteStations.stationId],
      set: parsed.data.fuelType ? { fuelType: parsed.data.fuelType } : { userId: user.id },
    })
  return NextResponse.json({ ok: true }, { status: 201 })
}

const patchSchema = z.object({
  stationId: z.string().regex(/^\d{1,8}$/),
  fuelType: z.enum(STATION_FUELS).optional(),
  alertEnabled: z.boolean().optional(),
  /** `null` quita el umbral (avisa de cualquier bajada notable). */
  alertThreshold: z.number().min(0.3).max(4).nullable().optional(),
})

/** Configura la favorita: combustible vigilado y alerta de precio. */
export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return unauthorized()
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })
  const { stationId, fuelType, alertEnabled, alertThreshold } = parsed.data

  const [fav] = await getDb()
    .select()
    .from(favoriteStations)
    .where(and(eq(favoriteStations.userId, user.id), eq(favoriteStations.stationId, stationId)))
    .limit(1)
  if (!fav) return NextResponse.json({ error: "No es una de tus favoritas" }, { status: 404 })

  const nextFuel = fuelType ?? fav.fuelType
  const enabling = alertEnabled === true && !fav.alertEnabled
  const changedFuel = fuelType !== undefined && fuelType !== fav.fuelType

  const set: Partial<typeof favoriteStations.$inferInsert> = {}
  if (fuelType !== undefined) set.fuelType = fuelType
  if (alertEnabled !== undefined) set.alertEnabled = alertEnabled
  if (alertThreshold !== undefined) set.alertThreshold = alertThreshold
  // Al activar la alerta o cambiar de combustible, la referencia es el precio de ahora mismo.
  if (enabling || changedFuel) {
    const [station] = await getStations([stationId])
    set.lastSeenPrice = station?.prices[nextFuel as StationFuel] ?? null
  }
  if (alertEnabled === false) set.lastSeenPrice = null

  await getDb().update(favoriteStations).set(set).where(and(eq(favoriteStations.userId, user.id), eq(favoriteStations.stationId, stationId)))
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) return unauthorized()
  const stationId = request.nextUrl.searchParams.get("stationId") ?? ""
  if (!/^\d{1,8}$/.test(stationId)) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })
  await getDb().delete(favoriteStations).where(and(eq(favoriteStations.userId, user.id), eq(favoriteStations.stationId, stationId)))
  return new NextResponse(null, { status: 204 })
}
