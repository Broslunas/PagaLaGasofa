import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getOwned(id: string, userId: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) return { error: Response.json({ error: "No encontrado" }, { status: 404 }) };
  if (vehicle.userId !== userId) return { error: Response.json({ error: "No autorizado" }, { status: 403 }) };
  return { vehicle };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await getOwned(id, session.user.id);
  if (error) return error;

  const body = await request.json();
  // Solo un vehículo por defecto: al marcar uno, desmarca los demás primero.
  if (body.isDefault === true) {
    await prisma.vehicle.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.avgConsumption === "number" && body.avgConsumption > 0) data.avgConsumption = body.avgConsumption;
  if (typeof body.isDefault === "boolean") data.isDefault = body.isDefault;
  if (typeof body.brand === "string" && body.brand.trim()) data.brand = body.brand.trim();
  if (typeof body.model === "string" && body.model.trim()) data.model = body.model.trim();
  if (typeof body.year === "number") data.year = body.year;
  if (typeof body.fuelType === "string" && body.fuelType.trim()) data.fuelType = body.fuelType.trim();

  const updated = await prisma.vehicle.update({ where: { id }, data });
  return Response.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { vehicle, error } = await getOwned(id, session.user.id);
  if (error) return error;

  await prisma.vehicle.delete({ where: { id } });

  // Si el borrado era el default, promociona el más reciente que quede.
  if (vehicle!.isDefault) {
    const next = await prisma.vehicle.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) await prisma.vehicle.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return Response.json({ ok: true });
}
