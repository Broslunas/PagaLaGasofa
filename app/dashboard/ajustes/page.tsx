import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccountSettings } from "@/components/dashboard/account-settings";

export default async function AjustesPage() {
  const session = await auth();
  const user = session!.user!;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    select: { id: true, endpoint: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <AccountSettings
        user={{ name: user.name ?? null, email: user.email ?? null, image: user.image ?? null }}
        initialSubscriptions={subscriptions.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
      />
    </>
  );
}
