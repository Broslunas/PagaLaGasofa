// Proxy a Nominatim (OSM) — server-side porque exige User-Agent propio y no da CORS al navegador.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ error: "Falta el parámetro q" }, { status: 400 });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");

  const res = await fetch(url, {
    headers: { "User-Agent": "PagaLaGasofa/1.0 (contacto: soporte@pagalagasofa.app)" },
  });
  if (!res.ok) return Response.json({ error: "Nominatim no respondió" }, { status: 502 });

  const results: { display_name: string; lat: string; lon: string }[] = await res.json();
  return Response.json(
    results.map((r) => ({ label: r.display_name, lat: Number(r.lat), lon: Number(r.lon) }))
  );
}
