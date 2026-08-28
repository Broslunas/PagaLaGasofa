// Proxy a OSRM (demo pública, sin API key) — distancia por carretera entre dos puntos.
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

  const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return Response.json({ error: "OSRM no respondió" }, { status: 502 });

  const data = await res.json();
  const meters = data?.routes?.[0]?.distance;
  if (typeof meters !== "number") {
    return Response.json({ error: "No se encontró ruta entre esos puntos" }, { status: 404 });
  }

  return Response.json({ distanceKm: Math.round((meters / 1000) * 10) / 10 });
}
