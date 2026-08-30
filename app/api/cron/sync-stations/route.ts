import { prisma } from "@/lib/prisma";
import { RawStation, transformRawStation } from "@/app/api/gasolineras/[id]/route";
import { formatMiteceoDate } from "@/lib/gas-prices";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Nº de upserts por comando raw a Mongo — muy por debajo del límite de 16MB
// por comando y de los 100k writes/comando de Mongo, deja margen holgado.
// Cuanto más grande, menos round-trips (el cuello de botella real es la
// latencia de red a Atlas, no el tamaño del payload).
const BATCH_SIZE = 3000;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Disparado por un cron externo (mismo patrón que app/api/cron/check-prices)
// con "Authorization: Bearer $CRON_SECRET", 1 vez al día.
//
// 1 solo fetch nacional a MITECO -> bulk upsert nativo de Mongo (no
// prisma.upsert() uno a uno, sería demasiado lento para ~12k estaciones) de:
// - StationInfo: datos que no cambian (nombre, dirección, horario, coords...)
// - StationPriceSnapshot: precios de hoy, que con el tiempo forman un
//   histórico permanente (una fecha pasada ya no vuelve a pedirse a MITECO).
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const res = await fetch(
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/",
    { cache: "no-store" }
  );
  if (!res.ok) {
    return Response.json({ error: "MITECO no respondió" }, { status: 502 });
  }
  const data = await res.json();
  const rawList: RawStation[] = data.ListaEESSPrecio || [];
  const stations = rawList.map(transformRawStation);

  const nowIso = new Date().toISOString();
  const today = formatMiteceoDate(new Date());

  const infoUpdates = stations.map((s) => ({
    q: { stationId: s.id },
    u: {
      $set: {
        stationId: s.id,
        name: s.name,
        brand: s.brand,
        address: s.address,
        postalCode: s.postalCode,
        city: s.city,
        municipality: s.municipality,
        province: s.province,
        provinceId: s.provinceId,
        schedule: s.schedule,
        margin: s.margin,
        saleType: s.saleType,
        remission: s.remission,
        lat: s.lat,
        lng: s.lng,
        syncedAt: { $date: nowIso },
      },
    },
    upsert: true,
  }));

  const snapshotUpdates = stations.map((s) => ({
    q: { stationId: s.id, date: today },
    u: {
      $set: { stationId: s.id, date: today, ...s.prices },
      $setOnInsert: { createdAt: { $date: nowIso } },
    },
    upsert: true,
  }));

  // Lotes de las 2 colecciones en paralelo — son escrituras independientes,
  // y el cuello de botella es la latency por round-trip a Atlas, no la carga
  // del propio servidor.
  await Promise.all([
    ...chunk(infoUpdates, BATCH_SIZE).map((batch) =>
      prisma.$runCommandRaw({ update: "StationInfo", ordered: false, updates: batch })
    ),
    ...chunk(snapshotUpdates, BATCH_SIZE).map((batch) =>
      prisma.$runCommandRaw({ update: "StationPriceSnapshot", ordered: false, updates: batch })
    ),
  ]);

  return Response.json({ stations: stations.length, date: today, updatedAt: data.Fecha });
}
