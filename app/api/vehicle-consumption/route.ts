// Proxy a API-Ninjas Cars — busca consumo medio por marca/modelo/año. Requiere API_NINJAS_KEY;
// si no está configurada, degrada con 501 y el usuario mete el consumo a mano (siempre funciona).
const MPG_TO_L100KM = 235.214583;

export async function GET(request: Request) {
  const key = process.env.API_NINJAS_KEY;
  if (!key) {
    return Response.json(
      { error: "Búsqueda automática no configurada, introduce el consumo manualmente" },
      { status: 501 }
    );
  }

  const params = new URL(request.url).searchParams;
  const make = params.get("make")?.trim();
  const model = params.get("model")?.trim();
  const year = params.get("year")?.trim();
  if (!make || !model) {
    return Response.json({ error: "Faltan make/model" }, { status: 400 });
  }

  const url = new URL("https://api.api-ninjas.com/v1/cars");
  url.searchParams.set("make", make);
  url.searchParams.set("model", model);
  if (year) url.searchParams.set("year", year);

  const res = await fetch(url, { headers: { "X-Api-Key": key } });
  if (!res.ok) return Response.json({ error: "API-Ninjas no respondió" }, { status: 502 });

  const cars: { combination_mpg?: number }[] = await res.json();
  const mpg = cars[0]?.combination_mpg;
  if (!mpg) return Response.json({ error: "No se encontró ese vehículo" }, { status: 404 });

  return Response.json({ consumptionL100: Math.round((MPG_TO_L100KM / mpg) * 10) / 10 });
}
