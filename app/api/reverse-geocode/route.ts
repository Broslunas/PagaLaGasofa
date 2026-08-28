// Proxy a Photon — igual que /api/geocode pero de coordenadas a dirección.
type PhotonFeature = {
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
    (v, i, arr) => v && arr.indexOf(v) === i
  );
  return parts.join(", ");
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = params.get("lat");
  const lon = params.get("lon");
  if (!lat || !lon) return Response.json({ error: "Faltan coordenadas" }, { status: 400 });

  const url = new URL("https://photon.komoot.io/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);

  const res = await fetch(url);
  if (!res.ok) return Response.json({ error: "Photon no respondió" }, { status: 502 });

  const { features }: { features: PhotonFeature[] } = await res.json();
  const label = features[0] ? buildLabel(features[0].properties) : "";
  return Response.json({
    label: label || `${lat}, ${lon}`,
    lat: Number(lat),
    lon: Number(lon),
  });
}
