import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TripList } from "@/components/dashboard/trip-list";

export default async function TripsPage() {
  const session = await auth();
  const trips = await prisma.trip.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Viajes</h1>
      <TripList trips={trips} />
    </>
  );
}
