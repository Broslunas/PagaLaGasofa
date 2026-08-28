import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const favorites = await prisma.favoriteStation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(favorites);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { stationId, name, brand, address, municipality, province, provinceId, lat, lng } = body;

  if (!stationId || !name) {
    return Response.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const favorite = await prisma.favoriteStation.upsert({
    where: {
      userId_stationId: {
        userId: session.user.id,
        stationId: String(stationId),
      },
    },
    create: {
      userId: session.user.id,
      stationId: String(stationId),
      name: String(name),
      brand: String(brand || "Estación"),
      address: String(address || ""),
      municipality: String(municipality || ""),
      province: String(province || ""),
      provinceId: provinceId ? String(provinceId) : null,
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
    },
    update: {
      name: String(name),
      brand: String(brand || "Estación"),
      address: String(address || ""),
      municipality: String(municipality || ""),
      province: String(province || ""),
      provinceId: provinceId ? String(provinceId) : null,
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
    },
  });

  return Response.json(favorite, { status: 201 });
}
