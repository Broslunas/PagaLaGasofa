import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TripList } from "@/components/dashboard/trip-list";
import { DashboardRoutesMap } from "@/components/dashboard/dashboard-routes-map";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [vehicleCount, tripCount, favoriteCount, totalCost, allTrips] = await Promise.all([
    prisma.vehicle.count({ where: { userId } }),
    prisma.trip.count({ where: { userId } }),
    prisma.favoriteStation.count({ where: { userId } }),
    prisma.trip.aggregate({ where: { userId }, _sum: { totalCost: true } }),
    prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const recentTrips = allTrips.slice(0, 5);

  const stats = [
    { label: "Vehículos", value: vehicleCount },
    { label: "Viajes", value: tripCount },
    { label: "Favoritas", value: favoriteCount },
    { label: "Gasto total", value: `${(totalCost._sum.totalCost ?? 0).toFixed(2)} €` },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Resumen</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardTitle className="text-2xl">{s.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{s.label}</CardContent>
          </Card>
        ))}
      </div>

      {/* Mapa global con todas las rutas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-base font-medium">Mapa de rutas</h2>
          <span className="text-xs text-muted-foreground">
            {allTrips.length} {allTrips.length === 1 ? "ruta registrada" : "rutas registradas"}
          </span>
        </div>
        <DashboardRoutesMap trips={allTrips} />
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
