// Proxy a Nominatim (OSM) — igual que /api/geocode pero de coordenadas a dirección.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = params.get("lat");
  const lon = params.get("lon");
  if (!lat || !lon) return Response.json({ error: "Faltan coordenadas" }, { status: 400 });

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { "User-Agent": "PagaLaGasofa/1.0 (contacto: soporte@broslunas.com)" },
  });
  if (!res.ok) return Response.json({ error: "Nominatim no respondió" }, { status: 502 });

  const data: { display_name?: string } = await res.json();
  return Response.json({
    label: data.display_name ?? `${lat}, ${lon}`,
    lat: Number(lat),
    lon: Number(lon),
  });
}
