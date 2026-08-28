import { prisma } from "@/lib/prisma";

// Ruta pública: quien tiene el shareId ya puede ver nombres e importes del
// ticket (mismo nivel de confianza que /t/[shareId]), así que dejar que se
// automarquen como pagados no añade una superficie de riesgo nueva. Solo
// acepta hasPaid — nada de importes ni datos del viaje.
export async function PATCH(request: Request, { params }: { params: Promise<{ shareId: string; index: string }> }) {
  const { shareId, index } = await params;
  const idx = Number(index);
  const body = await request.json();
  if (typeof body.hasPaid !== "boolean") {
    return Response.json({ error: "hasPaid inválido" }, { status: 400 });
  }

  const trip = await prisma.trip.findUnique({ where: { shareId } });
  if (!trip) return Response.json({ error: "Ticket no encontrado" }, { status: 404 });
  if (!Number.isInteger(idx) || idx < 0 || idx >= trip.passengers.length) {
    return Response.json({ error: "Índice de pasajero inválido" }, { status: 400 });
  }

  const passengers = trip.passengers.map((p, i) => (i === idx ? { ...p, hasPaid: body.hasPaid } : p));
  await prisma.trip.update({ where: { shareId }, data: { passengers } });
  return Response.json({ ok: true });
}
