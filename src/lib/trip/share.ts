import { formatCents } from "@/lib/format"

interface StopLike {
  label: string
  lat: number
  lng: number
}

/** Nombre corto de un lugar: lo que va antes de la primera coma. */
export const shortPlace = (label: string) => label.split(",")[0].trim()

export function tripTitle(title: string | null, stops: StopLike[]) {
  if (title?.trim()) return title.trim()
  return `${shortPlace(stops[0].label)} → ${shortPlace(stops[stops.length - 1].label)}`
}

/** Enlace de Google Maps con la ruta y sus paradas (máx. 9 intermedias, límite de Maps). */
export function mapsDirectionsUrl(stops: StopLike[]) {
  const point = (s: StopLike) => `${s.lat},${s.lng}`
  const url = new URL("https://www.google.com/maps/dir/")
  url.searchParams.set("api", "1")
  url.searchParams.set("origin", point(stops[0]))
  url.searchParams.set("destination", point(stops[stops.length - 1]))
  const via = stops.slice(1, -1).slice(0, 9)
  if (via.length) url.searchParams.set("waypoints", via.map(point).join("|"))
  url.searchParams.set("travelmode", "driving")
  return url.toString()
}

export function shareMessage(opts: { title: string; totalCents: number; url: string }) {
  return `${opts.title}: ${formatCents(opts.totalCents)} de gasolina repartidos. Mira lo que te toca pagar: ${opts.url}`
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`

/** Enlace secreto de gestión: el token va en el fragmento, que nunca llega a los servidores ni a los logs. */
export const manageUrl = (origin: string, shareId: string, token: string) => `${origin}/t/${shareId}#gestion=${token}`

export function parseManageFragment(hash: string): string | null {
  const match = /^#gestion=([0-9A-Za-z]{32})$/.exec(hash)
  return match ? match[1] : null
}
