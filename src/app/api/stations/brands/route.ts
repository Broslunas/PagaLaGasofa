import { NextResponse } from "next/server"

import { topBrands } from "@/lib/stations/queries"

export async function GET() {
  return NextResponse.json({ brands: await topBrands() }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } })
}
