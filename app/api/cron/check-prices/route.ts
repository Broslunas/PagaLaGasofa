import { prisma } from "@/lib/prisma";
import { fetchProvinceRawList } from "@/lib/gas-prices";
import { transformRawStation } from "@/app/api/gasolineras/[id]/route";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// Disparado por un cron externo (Vercel Cron / cron-job.org / GitHub Actions)
// con "Authorization: Bearer $CRON_SECRET". Solo compara Gasolina 95, mismo
// límite que ya documenta FavoriteStation.priceAtSave en el schema.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  // ?test=true: salta la lógica de precios y manda una notificación de prueba
  // a todo el que tenga push activado, para verificar que el cron y el envío
  // funcionan de verdad sin esperar a que baje un precio real.
  if (new URL(request.url).searchParams.get("test") === "true") {
    const subs = await prisma.pushSubscription.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });
    const title = "Prueba de notificación";
    const body = "Si ves esto, el cron y las notificaciones push funcionan.";
    for (const { userId } of subs) {
      await prisma.notification.create({ data: { userId, type: "test", title, body } });
      await sendPushToUser(userId, { title, body });
    }
    return Response.json({ test: true, sent: subs.length });
  }

  const favorites = await prisma.favoriteStation.findMany({
    where: { provinceId: { not: null }, priceAtSave: { not: null } },
  });

  // Agrupa por provincia: 1 llamada a MITECO por provincia, no por favorito.
  const byProvince = new Map<string, typeof favorites>();
  for (const fav of favorites) {
    const list = byProvince.get(fav.provinceId!) ?? [];
    list.push(fav);
    byProvince.set(fav.provinceId!, list);
  }

  let notified = 0;
  for (const [provinceId, favs] of byProvince) {
    let rawList;
    try {
      ({ list: rawList } = await fetchProvinceRawList(provinceId));
    } catch {
      continue; // provincia caída en esta pasada, se reintenta en la siguiente
    }
    const stationsById = new Map(rawList.map((r) => [r.IDEESS, transformRawStation(r)]));

    for (const fav of favs) {
      const currentPrice = stationsById.get(fav.stationId)?.prices.gasolina95;
      if (typeof currentPrice !== "number") continue;

      const base = fav.lastNotifiedPrice ?? fav.priceAtSave!;
      if (currentPrice >= base) continue; // solo avisa si baja más que la última vez avisada

      await prisma.favoriteStation.update({
        where: { id: fav.id },
        data: { lastNotifiedPrice: currentPrice },
      });

      const title = `Bajó el precio en ${fav.name}`;
      const body = `Gasolina 95 ahora a ${currentPrice.toFixed(3)} €/L (antes ${base.toFixed(3)} €/L)`;
      const url = `/gasolineras/${fav.stationId}`;

      await prisma.notification.create({
        data: { userId: fav.userId, type: "price_drop", title, body, url },
      });
      await sendPushToUser(fav.userId, { title, body, url });
      notified++;
    }
  }

  return Response.json({ checked: favorites.length, notified });
}
