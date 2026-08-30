// Construye el enlace que abre la app de mapas del sistema con la ruta completa
// (origen -> paradas -> destino). Google Maps en general, Apple Maps en iOS/Mac.
// ponytail: el orden de paradas es el de inserción, no el óptimo; añadir optimize=true si hace falta.

export interface LatLon {
  lat: number;
  lon: number;
}

export const isApplePlatform = () =>
  typeof navigator !== "undefined" && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);

export function buildMapsHref(from: LatLon, stops: LatLon[], to: LatLon) {
  if (isApplePlatform()) {
    const points = [from, ...stops, to].map((p) => `${p.lat},${p.lon}`);
    return `https://maps.apple.com/?saddr=${points[0]}&daddr=${points.slice(1).join("+to:")}`;
  }
  const waypointsParam = stops.map((w) => `${w.lat},${w.lon}`).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}${waypointsParam ? `&waypoints=${waypointsParam}` : ""}`;
}
