import { NextResponse, type NextRequest } from "next/server"

import { getStation } from "@/lib/stations/queries"

export async function GET(_request: NextRequest, { params }: RouteContext<"/api/stations/[id]">) {
  const id = (await params).id
  if (!/^\d{1,8}$/.test(id)) return NextResponse.json({ error: "Gasolinera no encontrada" }, { status: 404 })
  const station = await getStation(id)
  return station
    ? NextResponse.json({ station }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } })
    : NextResponse.json({ error: "Gasolinera no encontrada" }, { status: 404 })
}
