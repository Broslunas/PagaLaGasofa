import { NextResponse } from "next/server";
import { RawStation, transformRawStation } from "@/app/api/gasolineras/[id]/route";

export const revalidate = 3600; // cache 1 hour

const ALLOWED_DAYS = [7, 14, 30, 60, 90];

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const stationId = params.id;
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get("provincia");

  const rawDays = parseInt(searchParams.get("dias") || "30", 10);
  const days = ALLOWED_DAYS.includes(rawDays) ? rawDays : 30;

  // Step sampling for larger ranges to optimize performance
  const step = days > 60 ? 3 : days > 30 ? 2 : 1;

  const now = new Date();
  const dates: { label: string; dateStr: string }[] = [];

  for (let i = days - 1; i >= 0; i -= step) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push({
      label: d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: days > 30 ? "2-digit" : "short",
      }),
      dateStr: formatDate(d),
    });
  }

  try {
    const requests = dates.map(async ({ label, dateStr }) => {
      try {
        const url = provinceId
          ? `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestresHist/FiltroProvincia/${dateStr}/${provinceId}`
          : `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestresHist/${dateStr}`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        const rawList: RawStation[] = data.ListaEESSPrecio || [];
        const raw = rawList.find((item) => item.IDEESS === stationId);
        if (!raw) return null;

        const transformed = transformRawStation(raw);
        return {
          date: label,
          rawDate: dateStr,
          prices: transformed.prices,
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(requests);
    const history = results.filter(Boolean);

    return NextResponse.json({
      stationId,
      days,
      history,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
