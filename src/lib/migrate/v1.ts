// Transformaciones puras de los datos de la v1 (MongoDB/Prisma) al modelo de la v2 (Postgres).
// Sin acceso a bases de datos: se prueban con documentos de ejemplo y las usa scripts/migrate-v1.mts.
import { createHash } from "node:crypto"

import { FUEL_INFO, isFuelType, type FuelType } from "../trip/fuel"
import { haversineKm, simplifyPolyline } from "../trip/geo"

// ---------- Documentos de la v1 (lo que importa de cada modelo) ----------

export interface V1User { _id: unknown; name?: string | null; email?: string | null; emailVerified?: Date | string | null; image?: string | null }
export interface V1Account { userId: unknown; provider: string; providerAccountId: string }
export interface V1Vehicle { _id: unknown; userId: unknown; brand: string; model: string; year?: number | null; fuelType?: string | null; avgConsumption: number; isDefault?: boolean; createdAt?: Date | string }
export interface V1Passenger { name: string; amount: number; hasPaid?: boolean; pickupStop?: number | null; dropoffStop?: number | null }
export interface V1Point { label: string; lat: number; lon: number }
export interface V1Trip {
  _id: unknown; userId?: unknown | null
  origin: string; destination: string; title?: string | null
  originLat?: number | null; originLon?: number | null; destLat?: number | null; destLon?: number | null
  geometry?: string | null; waypoints?: V1Point[] | null
  distanceKm: number; isRoundTrip?: boolean
  consumptionL100: number; fuelPricePerLiter: number; fuelType?: string | null
  tollsCost?: number; extraCosts?: number
  totalCost: number; shareId: string; passengers?: V1Passenger[] | null; createdAt?: Date | string
}
export interface V1Favorite { userId: unknown; stationId: string }
export interface V1Push { userId: unknown; endpoint: string; p256dh: string; auth: string }
export interface V1Snapshot {
  stationId: string; date: string
  gasolina95?: number | null; gasolina98?: number | null; diesel?: number | null; dieselPremium?: number | null; glp?: number | null
}

// ---------- Utilidades ----------

const NAMESPACE = "pagalagasofa:v1-migration"

/** UUID determinista (formato v5) a partir de un id de Mongo: reejecutar el migrador no duplica filas. */
export function stableUuid(kind: string, id: unknown): string {
  const hash = createHash("sha1").update(`${NAMESPACE}:${kind}:${String(id)}`).digest()
  hash[6] = (hash[6] & 0x0f) | 0x50
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = hash.subarray(0, 16).toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const asDate = (v: Date | string | undefined | null) => {
  const d = v ? new Date(v) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}
const cents = (euros: number) => Math.round(Number((euros * 100).toPrecision(12)))
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n)

/** En v1 los ids de ticket eran cuid (25 caracteres, empiezan por «c»); en v2 son de 12 caracteres. Ambos son válidos. */
export const LEGACY_SHARE_ID = /^c[0-9a-z]{24}$/

export function mapFuel(value: string | null | undefined): FuelType {
  return isFuelType(value) ? value : "gasolina95"
}

// ---------- Usuarios ----------

export interface MappedUser {
  v1Id: string
  email: string
  name: string | null
  image: string | null
  googleSub: string | null
  verifiedAt: Date
}

/** Solo se migran usuarios con correo. El `sub` de Google permite que sigan entrando con Google. */
export function mapUser(user: V1User, accounts: V1Account[]): MappedUser | null {
  const email = user.email?.trim().toLowerCase()
  if (!email || !email.includes("@")) return null
  const google = accounts.find((a) => a.provider === "google")
  return {
    v1Id: String(user._id),
    email,
    name: user.name?.trim() || null,
    image: user.image ?? null,
    googleSub: google?.providerAccountId ?? null,
    verifiedAt: asDate(user.emailVerified) ?? new Date(),
  }
}

// ---------- Vehículos ----------

export function mapVehicle(v: V1Vehicle) {
  if (!finite(v.avgConsumption) || v.avgConsumption <= 0 || v.avgConsumption > 100) return null
  if (!v.brand?.trim() || !v.model?.trim()) return null
  return {
    id: stableUuid("vehicle", v._id),
    brand: v.brand.trim().slice(0, 40),
    model: v.model.trim().slice(0, 60),
    year: v.year && v.year >= 1950 && v.year <= 2100 ? v.year : null,
    fuelType: mapFuel(v.fuelType),
    consumptionPer100km: Math.round(v.avgConsumption * 100) / 100,
    isDefault: Boolean(v.isDefault),
    createdAt: asDate(v.createdAt) ?? new Date(),
  }
}

// ---------- Viajes ----------

export interface MappedTrip {
  trip: {
    id: string
    shareId: string
    v1UserId: string | null
    title: string | null
    stops: { label: string; lat: number; lng: number }[]
    legsKm: number[]
    geometry: [number, number][]
    distanceKm: number
    isRoundTrip: boolean
    fuelType: FuelType
    consumptionPer100km: number
    pricePerUnit: number
    tollsCents: number
    extras: { label: string; amountCents: number }[]
    energyUnits: number
    co2Kg: number
    energyCents: number
    totalCents: number
    createdAt: Date
  }
  passengers: { position: number; name: string; pickupStop: number; dropoffStop: number; amountCents: number; hasPaid: boolean }[]
}

export type TripSkip = "sin-coordenadas" | "datos-no-validos" | "sin-pasajeros"

function parseGeometry(raw: string | null | undefined): [number, number][] {
  if (!raw) return []
  try {
    const value = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    // En v1 la geometría es [lat, lon]; en v2, [lng, lat].
    const points = value.filter((p): p is [number, number] => Array.isArray(p) && finite(p[0]) && finite(p[1])).map(([lat, lon]) => [lon, lat] as [number, number])
    return simplifyPolyline(points, 15).map(([lng, lat]) => [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5] as [number, number])
  } catch {
    return []
  }
}

/** Reparte la distancia total entre tramos en proporción a la distancia en línea recta de cada uno. */
export function splitLegs(totalKm: number, stops: { lat: number; lng: number }[]): number[] {
  const n = stops.length - 1
  if (n <= 1) return [Math.round(totalKm * 100) / 100]
  const straight = Array.from({ length: n }, (_, i) => haversineKm(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng))
  const sum = straight.reduce((a, b) => a + b, 0)
  const legs = straight.map((d) => Math.round(((sum > 0 ? d / sum : 1 / n) * totalKm) * 100) / 100)
  // El último tramo absorbe el redondeo para que la suma sea exacta.
  legs[n - 1] = Math.round((totalKm - legs.slice(0, -1).reduce((a, b) => a + b, 0)) * 100) / 100
  return legs
}

export function mapTrip(t: V1Trip): { ok: true; value: MappedTrip } | { ok: false; reason: TripSkip } {
  if (!finite(t.distanceKm) || t.distanceKm <= 0 || !finite(t.consumptionL100) || !finite(t.fuelPricePerLiter) || !finite(t.totalCost) || t.totalCost < 0) {
    return { ok: false, reason: "datos-no-validos" }
  }
  const geometry = parseGeometry(t.geometry)

  const first = finite(t.originLat) && finite(t.originLon) ? { lat: t.originLat, lng: t.originLon } : geometry[0] ? { lat: geometry[0][1], lng: geometry[0][0] } : null
  const last = finite(t.destLat) && finite(t.destLon) ? { lat: t.destLat, lng: t.destLon } : geometry.at(-1) ? { lat: geometry.at(-1)![1], lng: geometry.at(-1)![0] } : null
  if (!first || !last) return { ok: false, reason: "sin-coordenadas" }

  const waypoints = (t.waypoints ?? []).filter((w) => finite(w.lat) && finite(w.lon))
  const stops = [
    { label: t.origin || "Origen", ...first },
    ...waypoints.map((w) => ({ label: w.label || "Parada", lat: w.lat, lng: w.lon })),
    { label: t.destination || "Destino", ...last },
  ]
  const legs = stops.length - 1
  const legsKm = splitLegs(t.distanceKm, stops)

  const fuelType = mapFuel(t.fuelType)
  const factor = t.isRoundTrip ? 2 : 1
  const totalKm = Math.round(t.distanceKm * factor * 100) / 100
  const energyUnits = Math.round(((totalKm / 100) * t.consumptionL100) * 100) / 100

  const tollsCents = cents(t.tollsCost ?? 0)
  const extraCents = cents(t.extraCosts ?? 0)
  const totalCents = cents(t.totalCost)
  // El total de v1 manda; la energía es lo que queda, para que las partes sumen siempre el total.
  const energyCents = Math.max(0, totalCents - tollsCents - extraCents)

  const passengers = (t.passengers ?? []).map((p, position) => {
    const pickup = Number.isInteger(p.pickupStop) ? (p.pickupStop as number) : 0
    const dropoff = Number.isInteger(p.dropoffStop) ? (p.dropoffStop as number) : legs
    const valid = position > 0 && pickup >= 0 && dropoff <= legs && pickup < dropoff
    return {
      position,
      name: (p.name || `Persona ${position}`).trim().slice(0, 40) || `Persona ${position}`,
      pickupStop: valid ? pickup : 0,
      dropoffStop: valid ? dropoff : legs,
      amountCents: cents(finite(p.amount) ? p.amount : 0),
      hasPaid: Boolean(p.hasPaid),
    }
  })
  if (passengers.length === 0) return { ok: false, reason: "sin-pasajeros" }

  return {
    ok: true,
    value: {
      trip: {
        id: stableUuid("trip", t._id),
        shareId: t.shareId,
        v1UserId: t.userId ? String(t.userId) : null,
        title: t.title?.trim().slice(0, 80) || null,
        stops,
        legsKm,
        geometry,
        distanceKm: totalKm,
        isRoundTrip: Boolean(t.isRoundTrip),
        fuelType,
        consumptionPer100km: Math.min(100, Math.max(0.1, Math.round(t.consumptionL100 * 100) / 100)),
        pricePerUnit: Math.min(10, Math.max(0, Math.round(t.fuelPricePerLiter * 1000) / 1000)),
        tollsCents,
        extras: extraCents > 0 ? [{ label: "Otros gastos", amountCents: extraCents }] : [],
        energyUnits,
        co2Kg: Math.round(energyUnits * FUEL_INFO[fuelType].co2KgPerUnit * 100) / 100,
        energyCents,
        totalCents,
        createdAt: asDate(t.createdAt) ?? new Date(),
      },
      passengers,
    },
  }
}

// ---------- Histórico de precios ----------

/** `dd-mm-yyyy` → `YYYY-MM-DD`, o null si no es una fecha real. */
export function snapshotDay(date: string): string | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date)
  if (!m) return null
  const [, d, mo, y] = m
  const iso = `${y}-${mo}-${d}`
  const parsed = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso ? null : iso
}

const price = (n: number | null | undefined) => (finite(n) && n >= 0.3 && n <= 4 ? Math.round(n * 1000) / 1000 : null)

export function mapSnapshot(s: V1Snapshot) {
  const day = snapshotDay(s.date)
  if (!day) return null
  const prices = { gasolina95: price(s.gasolina95), gasolina98: price(s.gasolina98), diesel: price(s.diesel), dieselPremium: price(s.dieselPremium), glp: price(s.glp) }
  return Object.values(prices).some((p) => p !== null) ? { stationId: s.stationId, day, ...prices } : null
}
