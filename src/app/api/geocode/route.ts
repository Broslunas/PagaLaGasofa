import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { dedupePlaces, placeFromPhoton } from "@/lib/routing/photon"

const PHOTON_URL = process.env.PHOTON_BASE_URL ?? "https://photon.komoot.io"

const querySchema = z.object({
  q: z.string().trim().min(3).max(120),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
})

export async function GET(request: NextRequest) {
  const limit = await rateLimit(request, { name: "geocode", limit: 60, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const sp = request.nextUrl.searchParams
  const parsed = querySchema.safeParse({
    q: sp.get("q") ?? "",
    lat: sp.get("lat") ?? undefined,
    lng: sp.get("lng") ?? undefined,
  })
  if (!parsed.success) return NextResponse.json({ results: [] })

  // Sesgo hacia el usuario: coordenadas del cliente o, si no, la geolocalización aproximada de Vercel.
  const headerLat = Number(request.headers.get("x-vercel-ip-latitude"))
  const headerLng = Number(request.headers.get("x-vercel-ip-longitude"))
  const lat = parsed.data.lat ?? (Number.isFinite(headerLat) && headerLat !== 0 ? headerLat : undefined)
  const lng = parsed.data.lng ?? (Number.isFinite(headerLng) && headerLng !== 0 ? headerLng : undefined)

  const url = new URL("/api/", PHOTON_URL)
  url.searchParams.set("q", parsed.data.q)
  url.searchParams.set("limit", "8")
  if (lat !== undefined && lng !== undefined) {
    url.searchParams.set("lat", String(lat))
    url.searchParams.set("lon", String(lng))
    url.searchParams.set("location_bias_scale", "0.4")
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "PagaLaGasofa/2.0 (pagalagasofa.broslunas.com)" },
    })
    if (!res.ok) throw new Error(`Photon ${res.status}`)
    const data = (await res.json()) as { features?: Parameters<typeof placeFromPhoton>[0][] }
    const places = (data.features ?? []).map(placeFromPhoton).filter((p) => p !== null)
    return NextResponse.json(
      { results: dedupePlaces(places).slice(0, 6) },
      { headers: { "Cache-Control": "private, max-age=300" } },
    )
  } catch {
    return NextResponse.json({ error: "El buscador no responde" }, { status: 502 })
  }
}
