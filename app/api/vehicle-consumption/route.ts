// Estima el consumo medio de un vehículo con Gemini — API-Ninjas Cars se descartó:
// en el plan gratuito, combination_mpg/city_mpg/highway_mpg vienen bloqueados.
// Usa generateContent (no la Interactions API beta: /v1beta/interactions se quedaba
// colgada sin responder nunca con esta key, confirmado con curl directo; generateContent
// respondió 200 al instante con la misma key).
// Requiere GEMINI_API_KEY; sin ella, degrada con 501 y el usuario mete el consumo a mano.
// Cachea por marca+modelo+año en VehicleConsumptionCache — mismo vehículo no
// vuelve a llamar a Gemini.
// generateContent usa un Schema estilo proto (no JSON Schema): tipos en mayúsculas,
// "nullable" en vez de type: [x, "null"] — esto último da 400 "Proto field is not repeating".
import { prisma } from "@/lib/prisma";

const SCHEMA = {
  type: "OBJECT",
  properties: {
    consumptionL100: {
      type: "NUMBER",
      nullable: true,
      description:
        "Consumo medio combinado en litros/100km para ese vehículo. null si es eléctrico o no se puede estimar.",
    },
  },
  required: ["consumptionL100"],
};

export async function GET(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Búsqueda automática no configurada, introduce el consumo manualmente" },
      { status: 501 }
    );
  }

  const params = new URL(request.url).searchParams;
  const brand = params.get("brand")?.trim();
  const model = params.get("model")?.trim();
  const year = params.get("year")?.trim();
  const fuelType = params.get("fuelType")?.trim();
  if (!brand || !model) {
    return Response.json({ error: "Faltan brand/model" }, { status: 400 });
  }

  const cacheKey = `${brand.toLowerCase()}|${model.toLowerCase()}|${year ?? ""}`;
  const cached = await prisma.vehicleConsumptionCache.findUnique({ where: { key: cacheKey } });
  if (cached) {
    return Response.json({ consumptionL100: cached.consumptionL100 });
  }

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Estima el consumo medio combinado (ciudad+carretera) en litros por 100km de este vehículo: marca ${brand}, modelo ${model}${year ? `, año ${year}` : ""}${fuelType ? `, combustible ${fuelType}` : ""}. Da tu mejor estimación aunque no sea exacta.`,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA },
      }),
    }
  );
  if (!res.ok) return Response.json({ error: "Gemini no respondió" }, { status: 502 });

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  const parsed = text ? JSON.parse(text) : null;
  const value = parsed?.consumptionL100;
  if (typeof value !== "number") {
    return Response.json({ error: "No se pudo estimar el consumo de ese vehículo" }, { status: 404 });
  }

  await prisma.vehicleConsumptionCache.upsert({
    where: { key: cacheKey },
    create: { key: cacheKey, consumptionL100: value },
    update: { consumptionL100: value },
  });

  return Response.json({ consumptionL100: value });
}
