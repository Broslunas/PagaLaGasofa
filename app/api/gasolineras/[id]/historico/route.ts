import { NextResponse } from "next/server";
import { RawStation, transformRawStation } from "@/app/api/gasolineras/[id]/route";
import { formatMiteceoDate as formatDate } from "@/lib/gas-prices";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // cache 1 hour

const ALLOWED_DAYS = [7, 14, 30, 60, 90];

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const stationId = params.id;
  const { searchParams } = new URL(request.url);
  // Provincia por query param o, si falta, la que ya tengamos cacheada en
  // StationInfo — mismo truco que app/api/gasolineras/[id]/route.ts para
  // no caer al fallback nacional completo en cada fecha sin cachear.
  let provinceId = searchParams.get("provincia");
  if (!provinceId) {
    const cached = await prisma.stationInfo.findUnique({
      where: { stationId },
      select: { provinceId: true },
    });
    provinceId = cached?.provinceId ?? null;
  }

  const rawDays = parseInt(searchParams.get("dias") || "30", 10);
  const days = ALLOWED_DAYS.includes(rawDays) ? rawDays : 30;

  // Sample down to ~10 points max — each point is a separate slow MITECO
  // fetch (full national/provincial list per day), so more points = more
  // parallel requests to a slow external API.
  const step = Math.max(1, Math.ceil(days / 10));

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
      // Fecha pasada ya cerrada en DB -> cero llamadas a MITECO.
      const cached = await prisma.stationPriceSnapshot.findUnique({
        where: { stationId_date: { stationId, date: dateStr } },
      });
      if (cached) {
        const {
          gasolina95, gasolina95Premium, gasolina98, diesel, dieselPremium,
          dieselB, glp, gnc, gnl, adblue, bioetanol, biodiesel, dieselRenovable, hidrogeno,
        } = cached;
        return {
          date: label,
          rawDate: dateStr,
          prices: {
            gasolina95, gasolina95Premium, gasolina98, diesel, dieselPremium,
            dieselB, glp, gnc, gnl, adblue, bioetanol, biodiesel, dieselRenovable, hidrogeno,
          },
        };
      }

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

        // Auto-relleno: guarda esta fecha para no volver a pedirla nunca más
        // (si es hoy, el cron de sync-stations la sobreescribirá más tarde).
        await prisma.stationPriceSnapshot
          .upsert({
            where: { stationId_date: { stationId, date: dateStr } },
            create: { stationId, date: dateStr, ...transformed.prices },
            update: transformed.prices,
          })
          .catch(() => {});

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
