import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return Response.json({ notifications, unreadCount });
}

// { all: true } marca todas; { ids: string[] } marca solo esas.
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const body = await request.json();

  if (body.all === true) {
    await prisma.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } });
  } else if (Array.isArray(body.ids)) {
    await prisma.notification.updateMany({
      where: { id: { in: body.ids }, userId: session.user.id },
      data: { read: true },
    });
  }

  return Response.json({ ok: true });
}
