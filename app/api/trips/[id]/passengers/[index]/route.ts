import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Passenger es un tipo embebido en Mongo (sin id propio): se direcciona por índice
// y se reescribe el array entero, Prisma no soporta update parcial de un elemento.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; index: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id, index } = await params;
  const idx = Number(index);
  const body = await request.json();
  if (typeof body.hasPaid !== "boolean") {
    return Response.json({ error: "hasPaid inválido" }, { status: 400 });
  }

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) return Response.json({ error: "Ticket no encontrado" }, { status: 404 });
  if (trip.userId !== session.user.id) return Response.json({ error: "No autorizado" }, { status: 403 });
  if (!Number.isInteger(idx) || idx < 0 || idx >= trip.passengers.length) {
    return Response.json({ error: "Índice de pasajero inválido" }, { status: 400 });
  }

  const passengers = trip.passengers.map((p, i) => (i === idx ? { ...p, hasPaid: body.hasPaid } : p));
  await prisma.trip.update({ where: { id }, data: { passengers } });
  return Response.json({ ok: true });
}
