import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getOwned(shareId: string, userId: string) {
  const share = await prisma.liveShare.findUnique({ where: { shareId } });
  if (!share) return { error: Response.json({ error: "No encontrado" }, { status: 404 }) };
  if (share.userId !== userId) return { error: Response.json({ error: "No autorizado" }, { status: 403 }) };
  return { share };
}

// Sin auth — shareId es capability URL (cuid impredecible), igual que app/t/[shareId].
// Solo expone lat/lng/updatedAt/expiresAt, nunca nombre/email del usuario.
export async function GET(_request: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const share = await prisma.liveShare.findUnique({ where: { shareId } });
  if (!share || share.stoppedAt || share.expiresAt < new Date()) {
    return Response.json({ error: "No disponible" }, { status: 404 });
  }
  return Response.json({ lat: share.lat, lng: share.lng, updatedAt: share.updatedAt, expiresAt: share.expiresAt });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const { shareId } = await params;
  const { error } = await getOwned(shareId, session.user.id);
  if (error) return error;

  const body = await request.json();
  const { lat, lng } = body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return Response.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }
  const updated = await prisma.liveShare.update({ where: { shareId }, data: { lat, lng } });
  return Response.json({ lat: updated.lat, lng: updated.lng, updatedAt: updated.updatedAt });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const { shareId } = await params;
  const { error } = await getOwned(shareId, session.user.id);
  if (error) return error;

  await prisma.liveShare.update({ where: { shareId }, data: { stoppedAt: new Date() } });
  return Response.json({ ok: true });
}
