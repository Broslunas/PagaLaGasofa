import { getDistanceKm, findClosestProvince } from "./provinces.ts";

// Distancia mínima punto-segmento en un plano local (aproximación equirrectangular,
// válida para segmentos cortos como los de una geometría de ruta OSRM). Evita
// añadir una dependencia de geo (turf) solo para esto.
function pointToSegmentKm(
  p: { lat: number; lng: number },
  a: [number, number],
  b: [number, number]
): number {
  const refLat = ((a[0] + b[0]) / 2) * (Math.PI / 180);
  const R = 6371;
  const toXY = (lat: number, lng: number): [number, number] => [
    lng * Math.cos(refLat) * (Math.PI / 180) * R,
    lat * (Math.PI / 180) * R,
  ];
  const [px, py] = toXY(p.lat, p.lng);
  const [ax, ay] = toXY(a[0], a[1]);
  const [bx, by] = toXY(b[0], b[1]);

  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

// Distancia mínima de un punto a una polilínea [lat,lng][]. Muestrea la
// polilínea a un máximo de puntos para acotar el coste (stations x segments)
// cuando la geometría OSRM trae cientos/miles de puntos.
export function distanceToPolylineKm(
  point: { lat: number; lng: number },
  polyline: [number, number][],
  maxSamples = 300
): number {
  if (polyline.length < 2) {
    return polyline.length === 1 ? getDistanceKm(point.lat, point.lng, polyline[0][0], polyline[0][1]) : Infinity;
  }
  const step = Math.max(1, Math.floor(polyline.length / maxSamples));
  let min = Infinity;
  for (let i = 0; i + step < polyline.length; i += step) {
    const d = pointToSegmentKm(point, polyline[i], polyline[i + step]);
    if (d < min) min = d;
  }
  return min;
}

// Provincias que atraviesa una ruta: muestrea la polilínea en puntos
// equiespaciados y busca la provincia más cercana a cada uno (por centroide,
// aproximado — no son límites administrativos reales, pero basta para saber
// qué provincias pedir a MITECO).
export function provincesAlongPolyline(polyline: [number, number][], samples = 15): string[] {
  if (polyline.length === 0) return [];
  const ids = new Set<string>();
  const step = Math.max(1, Math.floor(polyline.length / samples));
  for (let i = 0; i < polyline.length; i += step) {
    ids.add(findClosestProvince(polyline[i][0], polyline[i][1]));
  }
  ids.add(findClosestProvince(polyline[polyline.length - 1][0], polyline[polyline.length - 1][1]));
  return [...ids];
}
