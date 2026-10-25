import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { stationsAlongRoute } from "@/lib/stations/queries"
import { STATION_FUELS } from "@/lib/stations/types"

const bodySchema = z.object({
  geometry: z.array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])).min(2).max(5000),
  fuel: z.enum(STATION_FUELS).default("gasolina95"),
  radiusKm: z.number().min(0.5).max(10).default(3),
  limit: z.number().int().min(1).max(50).default(20),
})

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { name: "stations-route", limit: 20, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Ruta no válida" }, { status: 400 })

  const { geometry, fuel, radiusKm, limit: max } = parsed.data
  return NextResponse.json(await stationsAlongRoute(geometry, fuel, radiusKm, max))
}
