import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VehicleGarage } from "@/components/dashboard/vehicle-garage";
import { TripList } from "@/components/dashboard/trip-list";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [vehicles, trips] = await Promise.all([
    prisma.vehicle.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.trip.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-2xl font-semibold">Mi panel</h1>

        <VehicleGarage initialVehicles={vehicles} />

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-medium">Mis viajes</h2>
          <TripList trips={trips} />
        </div>
      </div>
    </div>
  );
}
