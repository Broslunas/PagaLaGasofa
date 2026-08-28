import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ stationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { stationId } = await params;

  await prisma.favoriteStation.deleteMany({
    where: {
      userId: session.user.id,
      stationId,
    },
  });

  return Response.json({ success: true });
}
