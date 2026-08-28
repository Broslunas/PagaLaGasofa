// Proxy a OSRM (demo pública, sin API key) — distancia por carretera y
// geometría de una ruta con N puntos (origen, paradas intermedias, destino).
export async function POST(request: Request) {
  const body = await request.json();
  const points = body?.points;
  if (!Array.isArray(points) || points.length < 2 || points.some((p) => typeof p?.lat !== "number" || typeof p?.lon !== "number")) {
    return Response.json({ error: "Faltan al menos 2 puntos válidos" }, { status: 400 });
  }

  const coords = points.map((p: { lat: number; lon: number }) => `${p.lon},${p.lat}`).join(";");
  // geometries=geojson devuelve las coordenadas de la ruta por carretera [lon, lat]
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return Response.json({ error: "No se ha podido calcular la distancia en coche" }, { status: 502 });

  const data = await res.json();
  const route = data?.routes?.[0];
  const meters = route?.distance;
  if (typeof meters !== "number") {
    return Response.json({ error: "No se encontró ruta entre esos puntos" }, { status: 404 });
  }

  const legs: number[] = (route?.legs ?? []).map((leg: { distance: number }) => Math.round((leg.distance / 1000) * 10) / 10);

  // GeoJSON coordinates son [lon, lat] -> convertimos a [lat, lon] para Leaflet Polyline
  const geometry: [number, number][] =
    route?.geometry?.coordinates?.map(([lon, lat]: [number, number]) => [lat, lon]) ?? [];

  return Response.json({
    distanceKm: Math.round((meters / 1000) * 10) / 10,
    legs,
    geometry,
  });
}
