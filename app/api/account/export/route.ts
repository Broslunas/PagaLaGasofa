import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Exportación RGPD (derecho de portabilidad): todo lo que el usuario ha
// introducido o generado en la app, en un único JSON descargable.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, vehicles, trips, favorites, liveShares, notifications, pushSubscriptions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, image: true } }),
    prisma.vehicle.findMany({ where: { userId } }),
    prisma.trip.findMany({ where: { userId } }),
    prisma.favoriteStation.findMany({ where: { userId } }),
    prisma.liveShare.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
    // Sin p256dh/auth: son claves de cifrado del navegador, no datos del usuario.
    prisma.pushSubscription.findMany({ where: { userId }, select: { endpoint: true, createdAt: true } }),
  ]);

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), account: user, vehicles, trips, favorites, liveShares, notifications, pushSubscriptions },
    null,
    2
  );

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="pagalagasofa-datos.json"`,
    },
  });
}
