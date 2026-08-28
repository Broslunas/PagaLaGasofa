import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VehicleGarage } from "@/components/dashboard/vehicle-garage";

export default async function VehiclesPage() {
  const session = await auth();
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Vehículos</h1>
      <VehicleGarage initialVehicles={vehicles} />
    </>
  );
}
