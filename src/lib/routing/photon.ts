import type { PlaceResult } from "./types"

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    osm_id?: number
    osm_type?: string
    name?: string
    street?: string
    housenumber?: string
    postcode?: string
    city?: string
    district?: string
    county?: string
    state?: string
    country?: string
  }
}

const unique = (parts: (string | undefined)[]) => [
  ...new Set(parts.filter((p): p is string => Boolean(p?.trim()))),
]

export function placeFromPhoton(feature: PhotonFeature): PlaceResult | null {
  const [lng, lat] = feature.geometry.coordinates
  const p = feature.properties
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const street = [p.street, p.housenumber].filter(Boolean).join(" ")
  const title = p.name ?? (street || p.city || p.county || p.state || p.country)
  if (!title) return null

  const subtitleParts = unique([p.name ? street : undefined, p.city ?? p.district, p.county, p.state, p.country])
  const subtitle = subtitleParts.filter((s) => s !== title).join(", ")

  return {
    id: `${p.osm_type ?? "x"}${p.osm_id ?? `${lat},${lng}`}`,
    label: [title, subtitle].filter(Boolean).join(", "),
    title,
    subtitle,
    lat,
    lng,
  }
}

/** Elimina duplicados visuales (mismo título y subtítulo). */
export function dedupePlaces(places: PlaceResult[]) {
  const seen = new Set<string>()
  return places.filter((p) => {
    const key = `${p.title}|${p.subtitle}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
