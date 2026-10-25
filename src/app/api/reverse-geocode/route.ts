import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { placeFromPhoton } from "@/lib/routing/photon"

const PHOTON_URL = process.env.PHOTON_BASE_URL ?? "https://photon.komoot.io"

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

export async function GET(request: NextRequest) {
  const limit = await rateLimit(request, { name: "reverse-geocode", limit: 40, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const sp = request.nextUrl.searchParams
  const parsed = querySchema.safeParse({ lat: sp.get("lat"), lng: sp.get("lng") })
  if (!parsed.success) return NextResponse.json({ error: "Coordenadas no válidas" }, { status: 400 })

  const url = new URL("/reverse", PHOTON_URL)
  url.searchParams.set("lat", String(parsed.data.lat))
  url.searchParams.set("lon", String(parsed.data.lng))

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "PagaLaGasofa/2.0 (pagalagasofa.broslunas.com)" },
    })
    if (!res.ok) throw new Error(`Photon ${res.status}`)
    const data = (await res.json()) as { features?: Parameters<typeof placeFromPhoton>[0][] }
    const place = data.features?.[0] ? placeFromPhoton(data.features[0]) : null
    // Si Photon no encuentra nada, se devuelve el punto con sus coordenadas como nombre.
    return NextResponse.json({
      result:
        place ??
        {
          id: `pt${parsed.data.lat},${parsed.data.lng}`,
          label: `${parsed.data.lat.toFixed(5)}, ${parsed.data.lng.toFixed(5)}`,
          title: "Punto en el mapa",
          subtitle: `${parsed.data.lat.toFixed(5)}, ${parsed.data.lng.toFixed(5)}`,
          ...parsed.data,
        },
    })
  } catch {
    return NextResponse.json({ error: "El buscador no responde" }, { status: 502 })
  }
}
