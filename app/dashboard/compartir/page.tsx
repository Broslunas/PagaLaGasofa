import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LiveShareControl } from "@/components/live-share/live-share-control";

export default async function CompartirPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const active = await prisma.liveShare.findFirst({
    where: { userId, stoppedAt: null, expiresAt: { gt: new Date() } },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Compartir ubicación</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Genera un enlace para que tus acompañantes vean tu posición en el mapa en tiempo real mientras viajas.
      </p>
      <LiveShareControl
        initialShare={active ? { shareId: active.shareId, expiresAt: active.expiresAt.toISOString() } : null}
      />
    </>
  );
}
