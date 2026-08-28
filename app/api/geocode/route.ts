// Proxy a Photon (komoot, basado en OSM) — gratis, sin API key, pensado para
// autocompletar mientras se escribe (mejor cobertura que Nominatim para queries cortas/parciales).
type PhotonFeature = {
  geometry: { coordinates: [number, number] }; // [lon, lat]
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

function buildLabel(p: PhotonFeature["properties"]) {
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const parts = [p.name, street, p.city, p.state, p.country].filter(
    (v, i, arr) => v && arr.indexOf(v) === i // sin duplicados (p.ej. name === city)
  );
  return parts.join(", ");
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ error: "Falta el parámetro q" }, { status: 400 });

  const url = new URL("https://photon.komoot.io/api");
  url.searchParams.set("q", q);
  // Sin "lang": Photon solo admite default/de/en/fr y "default" ya da los nombres
  // en el idioma local de OSM (español para España/Canarias).
  url.searchParams.set("limit", "6");
  // Sesgo hacia Canarias (mismo centro que el mapa) sin excluir el resto del mundo.
  url.searchParams.set("lat", "28.29");
  url.searchParams.set("lon", "-16.63");
  url.searchParams.set("zoom", "9");

  const res = await fetch(url);
  if (!res.ok) return Response.json({ error: "Photon no respondió" }, { status: 502 });

  const { features }: { features: PhotonFeature[] } = await res.json();
  return Response.json(
    features.map((f) => ({
      label: buildLabel(f.properties),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    }))
  );
}
