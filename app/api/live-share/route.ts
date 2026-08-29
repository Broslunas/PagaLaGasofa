import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DURATION_MS = 4 * 60 * 60 * 1000; // 4h — expira sola aunque el usuario olvide pararla.

// Idempotente: si ya hay una sesión activa la devuelve tal cual, evita duplicados
// si el usuario pulsa "Empezar" dos veces (p.ej. doble clic o recarga).
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const existing = await prisma.liveShare.findFirst({
    where: { userId: session.user.id, stoppedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existing) return Response.json(existing, { status: 200 });

  const created = await prisma.liveShare.create({
    data: { userId: session.user.id, expiresAt: new Date(Date.now() + DURATION_MS) },
  });
  return Response.json(created, { status: 201 });
}
