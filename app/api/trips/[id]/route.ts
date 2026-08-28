import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const round2 = (n: number) => Math.round(n * 100) / 100;

async function getOwned(id: string, userId: string) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) return { error: Response.json({ error: "No encontrado" }, { status: 404 }) };
  if (trip.userId !== userId) return { error: Response.json({ error: "No autorizado" }, { status: 403 }) };
  return { trip };
}

// Recalcula totales en servidor — nunca confía en totales que mande el cliente.
// tollsCost/extraCosts se reparten a partes iguales entre pasajeros (flatShare
// en calculateTrip no depende de legsKm), así que un delta simple basta: no
// hace falta legsKm (no se persiste, solo distanceKm total) para mantener el
// reparto exacto en este caso.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { trip, error } = await getOwned(id, session.user.id);
  if (error) return error;

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    data.title = body.title.trim() || null;
  }

  if (Array.isArray(body.passengers)) {
    const passengers = trip!.passengers.map((p, i) => {
      const override = body.passengers.find((o: { index?: unknown }) => o.index === i);
      if (!override || typeof override.amount !== "number" || override.amount < 0) return p;
      return { ...p, amount: round2(override.amount) };
    });
    const totalCost = round2(passengers.reduce((sum, p) => sum + p.amount, 0));
    data.passengers = passengers;
    data.totalCost = totalCost;
    data.costPerPassenger = round2(totalCost / passengers.length);
    data.driverReceives = round2(totalCost - passengers[0].amount);
  } else if (typeof body.tollsCost === "number" || typeof body.extraCosts === "number") {
    const newTolls = typeof body.tollsCost === "number" ? body.tollsCost : trip!.tollsCost;
    const newExtra = typeof body.extraCosts === "number" ? body.extraCosts : trip!.extraCosts;
    if (newTolls < 0 || newExtra < 0) {
      return Response.json({ error: "Costes inválidos" }, { status: 400 });
    }
    const diff = newTolls + newExtra - (trip!.tollsCost + trip!.extraCosts);
    const passengers = trip!.passengers.map((p) => ({ ...p, amount: round2(p.amount + diff / trip!.passengers.length) }));
    const totalCost = round2(trip!.totalCost + diff);
    data.tollsCost = newTolls;
    data.extraCosts = newExtra;
    data.passengers = passengers;
    data.totalCost = totalCost;
    data.costPerPassenger = round2(totalCost / passengers.length);
    data.driverReceives = round2(totalCost - passengers[0].amount);
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await prisma.trip.update({ where: { id }, data });
  return Response.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await getOwned(id, session.user.id);
  if (error) return error;

  await prisma.trip.delete({ where: { id } });
  return Response.json({ ok: true });
}
