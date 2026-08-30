import { NextResponse } from "next/server";
import { fetchProvinceRawList, rawStationToGasStation, type GasStation } from "@/lib/gas-prices";
import { distanceToPolylineKm, provincesAlongPolyline } from "@/lib/geo";

export const maxDuration = 30;

const BUFFER_KM = 3; // corredor a ambos lados de la ruta
const MAX_RESULTS = 40;

export async function POST(request: Request) {
  const body = await request.json();
  const polyline = body?.polyline;
  const fuel = typeof body?.fuel === "string" ? body.fuel : "gasolina95";

  if (!Array.isArray(polyline) || polyline.length < 2) {
    return NextResponse.json({ error: "Falta la geometría de la ruta (polyline)" }, { status: 400 });
  }

  const provinceIds = provincesAlongPolyline(polyline);

  const results = await Promise.allSettled(provinceIds.map((id) => fetchProvinceRawList(id)));
  const updatedAts: string[] = [];
  const stations: GasStation[] = [];
  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    updatedAts.push(r.value.updatedAt);
    for (const raw of r.value.list) {
      stations.push({ ...rawStationToGasStation(raw), provinceId: provinceIds[i] });
    }
  });

  if (results.every((r) => r.status === "rejected")) {
    return NextResponse.json({ error: "No se pudo consultar MITECO" }, { status: 502 });
  }

  const nearRoute = stations
    .filter((s) => s.lat !== 0 && s.lng !== 0)
    .map((s) => ({ ...s, distanceFromRouteKm: distanceToPolylineKm(s, polyline) }))
    .filter((s) => s.distanceFromRouteKm <= BUFFER_KM);

  nearRoute.sort((a, b) => {
    const pA = a.prices[fuel as keyof typeof a.prices] ?? Infinity;
    const pB = b.prices[fuel as keyof typeof b.prices] ?? Infinity;
    if (pA !== pB) return pA - pB;
    return a.distanceFromRouteKm - b.distanceFromRouteKm;
  });

  return NextResponse.json({
    updatedAt: updatedAts[0] ?? "",
    provincesChecked: provinceIds.length,
    total: nearRoute.length,
    stations: nearRoute.slice(0, MAX_RESULTS),
  });
}
