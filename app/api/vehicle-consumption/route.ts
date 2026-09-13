import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const apiKey = process.env.AI_API_KEY || "sk-38193f062aa4aa21-f6c5l7-247c92aa";
  const baseUrl = process.env.AI_BASE_URL || "https://ai.broslunas.com/v1";
  const model = process.env.AI_MODEL || "rotate-top";

  if (!apiKey) {
    return Response.json(
      { error: "Búsqueda automática no configurada, introduce el consumo manualmente" },
      { status: 501 }
    );
  }

  const params = new URL(request.url).searchParams;
  const brand = params.get("brand")?.trim();
  const modelName = params.get("model")?.trim();
  const year = params.get("year")?.trim();
  const fuelType = params.get("fuelType")?.trim();
  if (!brand || !modelName) {
    return Response.json({ error: "Faltan brand/model" }, { status: 400 });
  }

  const cacheKey = `${brand.toLowerCase()}|${modelName.toLowerCase()}|${year ?? ""}`;
  const cached = await prisma.vehicleConsumptionCache.findUnique({ where: { key: cacheKey } });
  if (cached) {
    return Response.json({ consumptionL100: cached.consumptionL100 });
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Eres un experto en automoción. Devuelve exclusivamente un objeto JSON con la clave "consumptionL100" (número con el consumo medio en l/100km, o null si es eléctrico o desconocido). Ejemplo: {"consumptionL100": 5.8}',
        },
        {
          role: "user",
          content: `Estima el consumo medio combinado en l/100km para: marca ${brand}, modelo ${modelName}${
            year ? `, año ${year}` : ""
          }${fuelType ? `, combustible ${fuelType}` : ""}.`,
        },
      ],
    }),
  });

  if (!res.ok) return Response.json({ error: "El router de IA no respondió" }, { status: 502 });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  // Limpia posibles tags <think> de modelos con razonamiento
  const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : null;
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
