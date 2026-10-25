/** Geometría básica sobre coordenadas [lat, lng]. Sin dependencias. */

export type LatLng = { lat: number; lng: number }
export type LatLngTuple = [number, number]

const EARTH_RADIUS_KM = 6371
const toRad = (deg: number) => (deg * Math.PI) / 180

/** Distancia entre dos puntos en línea recta (haversine). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/**
 * Distancia punto-segmento en un plano local (aproximación equirrectangular,
 * válida para segmentos cortos como los de una ruta OSRM).
 */
function pointToSegmentKm(p: LatLng, a: LatLngTuple, b: LatLngTuple): number {
  const refLat = toRad((a[0] + b[0]) / 2)
  const toXY = (lat: number, lng: number): [number, number] => [
    toRad(lng) * Math.cos(refLat) * EARTH_RADIUS_KM,
    toRad(lat) * EARTH_RADIUS_KM,
  ]
  const [px, py] = toXY(p.lat, p.lng)
  const [ax, ay] = toXY(a[0], a[1])
  const [bx, by] = toXY(b[0], b[1])

  const abx = bx - ax
  const aby = by - ay
  const lenSq = abx * abx + aby * aby
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq))
  return Math.hypot(px - (ax + t * abx), py - (ay + t * aby))
}

/**
 * Distancia mínima de un punto a una polilínea. Muestrea la polilínea hasta
 * `maxSamples` puntos para acotar el coste con geometrías de miles de puntos.
 */
export function distanceToPolylineKm(
  point: LatLng,
  polyline: LatLngTuple[],
  maxSamples = 300,
): number {
  if (polyline.length === 0) return Infinity
  if (polyline.length === 1) return haversineKm(point.lat, point.lng, polyline[0][0], polyline[0][1])

  const step = Math.max(1, Math.floor(polyline.length / maxSamples))
  let min = Infinity
  for (let i = 0; i < polyline.length - 1; i += step) {
    const next = Math.min(i + step, polyline.length - 1)
    min = Math.min(min, pointToSegmentKm(point, polyline[i], polyline[next]))
  }
  return min
}

/**
 * Simplifica una polilínea [lng, lat] con Ramer–Douglas–Peucker (iterativo, sin
 * recursión) conservando los extremos. `toleranceM` en metros.
 */
export function simplifyPolyline(points: [number, number][], toleranceM = 15): [number, number][] {
  if (points.length <= 2) return points.slice()

  const refLat = toRad(points[Math.floor(points.length / 2)][1])
  const mPerDegLat = (Math.PI / 180) * EARTH_RADIUS_KM * 1000
  const xy = points.map(([lng, lat]) => [lng * Math.cos(refLat) * mPerDegLat, lat * mPerDegLat] as const)

  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]

  while (stack.length) {
    const [start, end] = stack.pop()!
    const [ax, ay] = xy[start]
    const [bx, by] = xy[end]
    const dx = bx - ax
    const dy = by - ay
    const lenSq = dx * dx + dy * dy

    let maxDist = 0
    let index = -1
    for (let i = start + 1; i < end; i++) {
      const [px, py] = xy[i]
      const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
      const dist = Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
      if (dist > maxDist) {
        maxDist = dist
        index = i
      }
    }
    if (index !== -1 && maxDist > toleranceM) {
      keep[index] = 1
      stack.push([start, index], [index, end])
    }
  }
  return points.filter((_, i) => keep[i])
}
