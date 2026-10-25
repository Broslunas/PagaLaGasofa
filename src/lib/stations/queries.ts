import "server-only"

import { and, asc, between, desc, eq, gt, isNotNull, sql, type SQL } from "drizzle-orm"

import { getDb } from "@/db"
import { favoriteStations, stationPriceHistory, stations, type Station } from "@/db/schema"
import { distanceToPolylineKm, type LatLngTuple } from "@/lib/trip/geo"

import { openStatus, timeZoneFor } from "./opening-hours"
import type { PriceMap, StationDto, StationFuel } from "./types"

const FUEL_COLUMN = {
  gasolina95: stations.priceGasolina95,
  gasolina98: stations.priceGasolina98,
  diesel: stations.priceDiesel,
  dieselPremium: stations.priceDieselPremium,
  glp: stations.priceGlp,
} as const

const HISTORY_COLUMN = {
  gasolina95: stationPriceHistory.priceGasolina95,
  gasolina98: stationPriceHistory.priceGasolina98,
  diesel: stationPriceHistory.priceDiesel,
  dieselPremium: stationPriceHistory.priceDieselPremium,
  glp: stationPriceHistory.priceGlp,
} as const

const KM_PER_DEG_LAT = 111.32
/** Una estación que no aparece en la sincronización durante 3 días se considera cerrada o dada de baja. */
const freshEnough = () => gt(stations.seenAt, sql`now() - interval '3 days'`)

export function toDto(row: Station, distanceKm?: number, now = new Date()): StationDto {
  const status = openStatus(row.schedule, now, timeZoneFor(row.lat))
  const prices: PriceMap = {
    gasolina95: row.priceGasolina95,
    gasolina98: row.priceGasolina98,
    diesel: row.priceDiesel,
    dieselPremium: row.priceDieselPremium,
    glp: row.priceGlp,
  }
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    address: row.address,
    locality: row.locality,
    province: row.province,
    lat: row.lat,
    lng: row.lng,
    schedule: row.schedule,
    prices,
    ...(distanceKm === undefined ? {} : { distanceKm: Math.round(distanceKm * 10) / 10 }),
    open: status.open,
    openLabel: status.label,
  }
}

/** Distancia en km (haversine) entre un punto y la estación, calculada en SQL. */
const distanceSql = (lat: number, lng: number) =>
  sql<number>`2 * 6371 * asin(sqrt(power(sin(radians(${stations.lat} - ${lat}) / 2), 2) + cos(radians(${lat})) * cos(radians(${stations.lat})) * power(sin(radians(${stations.lng} - ${lng}) / 2), 2)))`

export interface SearchParams {
  lat: number
  lng: number
  radiusKm: number
  fuel: StationFuel
  sort: "price" | "distance"
  openNow: boolean
  brand?: string
  limit: number
}

export async function searchStations(p: SearchParams): Promise<StationDto[]> {
  const dLat = p.radiusKm / KM_PER_DEG_LAT
  const dLng = p.radiusKm / (KM_PER_DEG_LAT * Math.max(0.2, Math.cos((p.lat * Math.PI) / 180)))
  const price = FUEL_COLUMN[p.fuel]
  const distance = distanceSql(p.lat, p.lng)

  const filters: SQL[] = [
    between(stations.lat, p.lat - dLat, p.lat + dLat),
    between(stations.lng, p.lng - dLng, p.lng + dLng),
    eq(stations.publicSale, true),
    isNotNull(price),
    freshEnough(),
    sql`${distance} <= ${p.radiusKm}`,
  ]
  if (p.brand) filters.push(eq(stations.brand, p.brand))

  // El filtro «abierto ahora» se aplica después (el horario es texto), así que se piden más candidatas.
  const candidates = p.openNow ? 400 : p.limit
  const rows = await getDb()
    .select({ station: stations, distance })
    .from(stations)
    .where(and(...filters))
    .orderBy(...(p.sort === "price" ? [asc(price), asc(distance)] : [asc(distance), asc(price)]))
    .limit(candidates)

  const now = new Date()
  const dtos = rows.map((r) => toDto(r.station, Number(r.distance), now))
  return (p.openNow ? dtos.filter((s) => s.open !== false) : dtos).slice(0, p.limit)
}

export async function getStation(id: string): Promise<StationDto | null> {
  const [row] = await getDb().select().from(stations).where(eq(stations.id, id)).limit(1)
  return row ? toDto(row) : null
}

export async function getStations(ids: string[]): Promise<StationDto[]> {
  if (ids.length === 0) return []
  const rows = await getDb().select().from(stations).where(sql`${stations.id} = any(${ids})`)
  return rows.map((r) => toDto(r))
}

export interface HistoryPoint {
  day: string
  price: number
}

export async function stationHistory(id: string, fuel: StationFuel, days: number): Promise<HistoryPoint[]> {
  const col = HISTORY_COLUMN[fuel]
  const rows = await getDb()
    .select({ day: stationPriceHistory.day, price: col })
    .from(stationPriceHistory)
    .where(and(eq(stationPriceHistory.stationId, id), isNotNull(col), sql`${stationPriceHistory.day} >= current_date - ${days}::int`))
    .orderBy(asc(stationPriceHistory.day))
  return rows.map((r) => ({ day: r.day, price: r.price as number }))
}

export interface RouteStations {
  stations: StationDto[]
  stats: { count: number; min: number | null; avg: number | null; max: number | null }
}

/** Gasolineras a menos de `radiusKm` de una ruta, de la más barata a la más cara. */
export async function stationsAlongRoute(geometry: [number, number][], fuel: StationFuel, radiusKm: number, limit: number): Promise<RouteStations> {
  const lngs = geometry.map((g) => g[0])
  const lats = geometry.map((g) => g[1])
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const dLat = radiusKm / KM_PER_DEG_LAT
  const dLng = radiusKm / (KM_PER_DEG_LAT * Math.max(0.2, Math.cos((midLat * Math.PI) / 180)))
  const price = FUEL_COLUMN[fuel]

  const rows = await getDb()
    .select()
    .from(stations)
    .where(
      and(
        between(stations.lat, Math.min(...lats) - dLat, Math.max(...lats) + dLat),
        between(stations.lng, Math.min(...lngs) - dLng, Math.max(...lngs) + dLng),
        eq(stations.publicSale, true),
        isNotNull(price),
        freshEnough(),
      ),
    )
    .orderBy(asc(price))
    .limit(4000)

  const polyline: LatLngTuple[] = geometry.map(([lng, lat]) => [lat, lng])
  const now = new Date()
  const near: StationDto[] = []
  for (const row of rows) {
    const d = distanceToPolylineKm({ lat: row.lat, lng: row.lng }, polyline)
    if (d <= radiusKm) near.push(toDto(row, d, now))
  }

  const prices = near.map((s) => s.prices[fuel] as number)
  return {
    stations: near.slice(0, limit),
    stats: {
      count: near.length,
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null,
      avg: prices.length ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 1000) / 1000 : null,
    },
  }
}

export async function topBrands(limit = 24) {
  return getDb()
    .select({ brand: stations.brand, count: sql<number>`count(*)::int` })
    .from(stations)
    .where(and(sql`${stations.brand} <> ''`, eq(stations.publicSale, true), freshEnough()))
    .groupBy(stations.brand)
    .orderBy(desc(sql`count(*)`))
    .limit(limit)
}

export async function listFavorites(userId: string) {
  return getDb().select().from(favoriteStations).where(eq(favoriteStations.userId, userId)).orderBy(desc(favoriteStations.createdAt))
}
