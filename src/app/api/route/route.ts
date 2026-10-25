import { NextResponse, type NextRequest } from "next/server"

import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { routeRequestSchema, type RouteResult } from "@/lib/routing/types"
import { simplifyPolyline } from "@/lib/trip/geo"

const OSRM_URL = process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org"

interface OsrmResponse {
  code: string
  routes?: {
    distance: number
    duration: number
    legs: { distance: number }[]
    geometry: { coordinates: [number, number][] }
  }[]
}

const round = (n: number, decimals: number) => Number(n.toFixed(decimals))

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { name: "route", limit: 30, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON no válido" }, { status: 400 })
  }
  const parsed = routeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Puntos no válidos" }, { status: 400 })
  }

  const coords = parsed.data.points.map((p) => `${round(p.lng, 6)},${round(p.lat, 6)}`).join(";")
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`

  let osrm: OsrmResponse
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "PagaLaGasofa/2.0 (pagalagasofa.broslunas.com)" },
    })
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    osrm = await res.json()
  } catch {
    return NextResponse.json({ error: "El servicio de rutas no responde" }, { status: 502 })
  }

  const route = osrm.routes?.[0]
  if (osrm.code !== "Ok" || !route) {
    return NextResponse.json({ error: "No hay ruta posible entre esos puntos" }, { status: 404 })
  }

  const result: RouteResult = {
    distanceKm: round(route.distance / 1000, 2),
    durationMin: Math.round(route.duration / 60),
    legsKm: route.legs.map((leg) => round(leg.distance / 1000, 2)),
    geometry: simplifyPolyline(route.geometry.coordinates, 15).map(([lng, lat]) => [
      round(lng, 5),
      round(lat, 5),
    ]),
  }
  return NextResponse.json(result)
}
