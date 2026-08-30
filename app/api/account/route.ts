import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Borra la cuenta y todo lo que cuelga de ella. Cascade en el schema se
// encarga de accounts/sessions/vehicles/favorites/liveShares/notifications/
// pushSubscriptions; Trip.userId es SetNull (los tickets ya compartidos
// sobreviven, solo se desvinculan del usuario).
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  await prisma.user.delete({ where: { id: session.user.id } });
  return Response.json({ ok: true });
}
