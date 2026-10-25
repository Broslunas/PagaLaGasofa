import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { stationHistory } from "@/lib/stations/queries"
import { STATION_FUELS } from "@/lib/stations/types"

const querySchema = z.object({
  fuel: z.enum(STATION_FUELS).default("gasolina95"),
  days: z.coerce.number().int().min(7).max(365).default(30),
})

export async function GET(request: NextRequest, { params }: RouteContext<"/api/stations/[id]/history">) {
  const id = (await params).id
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success || !/^\d{1,8}$/.test(id)) return NextResponse.json({ error: "Parámetros no válidos" }, { status: 400 })
  const points = await stationHistory(id, parsed.data.fuel, parsed.data.days)
  return NextResponse.json({ points }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } })
}
