import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TripList } from "@/components/dashboard/trip-list";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [vehicleCount, tripCount, totalCost, recentTrips] = await Promise.all([
    prisma.vehicle.count({ where: { userId } }),
    prisma.trip.count({ where: { userId } }),
    prisma.trip.aggregate({ where: { userId }, _sum: { totalCost: true } }),
    prisma.trip.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Vehículos", value: vehicleCount },
    { label: "Viajes", value: tripCount },
    { label: "Gasto total", value: `${(totalCost._sum.totalCost ?? 0).toFixed(2)} €` },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Resumen</h1>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardTitle className="text-2xl">{s.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{s.label}</CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-base font-medium">Últimos viajes</h2>
          <Link href="/dashboard/trips" className="text-sm text-muted-foreground hover:underline">
            Ver todos
          </Link>
        </div>
        <TripList trips={recentTrips} />
      </div>
    </>
  );
}
