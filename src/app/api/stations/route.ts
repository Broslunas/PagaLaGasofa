import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { searchStations } from "@/lib/stations/queries"
import { STATION_FUELS } from "@/lib/stations/types"

const querySchema = z.object({
  lat: z.coerce.number().min(27).max(44.5),
  lng: z.coerce.number().min(-19).max(5.5),
  radius: z.coerce.number().min(1).max(50).default(10),
  fuel: z.enum(STATION_FUELS).default("gasolina95"),
  sort: z.enum(["price", "distance"]).default("price"),
  open: z.enum(["1", "0"]).default("0"),
  brand: z.string().trim().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
})

export async function GET(request: NextRequest) {
  const limit = await rateLimit(request, { name: "stations", limit: 120, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: "Parámetros no válidos" }, { status: 400 })
  const q = parsed.data

  const stations = await searchStations({
    lat: q.lat, lng: q.lng, radiusKm: q.radius, fuel: q.fuel, sort: q.sort, openNow: q.open === "1", brand: q.brand, limit: q.limit,
  })
  return NextResponse.json({ stations }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } })
}
