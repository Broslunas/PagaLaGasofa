import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Lista de dispositivos suscritos, para la página de ajustes. Sin
// p256dh/auth: son claves de cifrado del navegador, no hace falta mostrarlas.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
    select: { id: true, endpoint: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ subscriptions });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const body = await request.json();
  const { endpoint, keys } = body;
  if (typeof endpoint !== "string" || typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") {
    return Response.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
  });

  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  // Por endpoint (dispositivo actual, al desactivar desde este mismo
  // navegador) o por id (revocar otro dispositivo desde ajustes).
  const { endpoint, id } = await request.json();
  if (typeof endpoint !== "string" && typeof id !== "string") {
    return Response.json({ error: "endpoint o id requerido" }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({
    where: { userId: session.user.id, ...(id ? { id } : { endpoint } as Record<string, unknown>) },
  });
  return Response.json({ ok: true });
}
