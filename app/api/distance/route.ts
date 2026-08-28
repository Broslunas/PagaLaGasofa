// Proxy a OSRM (demo pública, sin API key) — distancia y geometría por carretera entre dos puntos.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const [originLat, originLon, destLat, destLon] = [
    params.get("originLat"),
    params.get("originLon"),
    params.get("destLat"),
    params.get("destLon"),
  ];
  if (!originLat || !originLon || !destLat || !destLon) {
    return Response.json({ error: "Faltan coordenadas" }, { status: 400 });
  }

  // geometries=geojson devuelve las coordenadas de la ruta por carretera [lon, lat]
  const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return Response.json({ error: "OSRM no respondió" }, { status: 502 });

  const data = await res.json();
  const route = data?.routes?.[0];
  const meters = route?.distance;
  if (typeof meters !== "number") {
    return Response.json({ error: "No se encontró ruta entre esos puntos" }, { status: 404 });
  }

  // GeoJSON coordinates son [lon, lat] -> convertimos a [lat, lon] para Leaflet Polyline
  const geometry: [number, number][] =
    route?.geometry?.coordinates?.map(([lon, lat]: [number, number]) => [lat, lon]) ?? [];

  return Response.json({
    distanceKm: Math.round((meters / 1000) * 10) / 10,
    geometry,
  });
}
