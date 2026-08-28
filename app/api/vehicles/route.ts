import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(vehicles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { brand, model, year, fuelType, avgConsumption } = body;
  if (typeof brand !== "string" || !brand.trim() || typeof model !== "string" || !model.trim() || typeof fuelType !== "string" || !fuelType.trim()) {
    return Response.json({ error: "Faltan campos" }, { status: 400 });
  }
  if (typeof year !== "number" || typeof avgConsumption !== "number" || avgConsumption <= 0) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Primer vehículo del usuario → por defecto automáticamente.
  const count = await prisma.vehicle.count({ where: { userId: session.user.id } });
  const vehicle = await prisma.vehicle.create({
    data: { userId: session.user.id, brand, model, year, fuelType, avgConsumption, isDefault: count === 0 },
  });
  return Response.json(vehicle, { status: 201 });
}
