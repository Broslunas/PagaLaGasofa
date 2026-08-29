import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aggregateTripStats, type PeriodTotals } from "@/lib/trip-stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

// Menor gasto/litros/CO2 es mejor: bajada = verde, subida = rojo (invierte el
// criterio habitual de price-history-chart.tsx, donde subir de precio es malo
// pero aquí gastar menos es la meta).
function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-muted-foreground">Sin datos del mes anterior</span>;
  }
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  const color =
    pct > 0
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : pct < 0
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Icon size={12} />
      {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}% vs mes anterior
    </span>
  );
}

function StatCard({ label, value, pct }: { label: string; value: string; pct: number | null }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {label}
        <DeltaBadge pct={pct} />
      </CardContent>
    </Card>
  );
}

function YearCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{label}</CardContent>
    </Card>
  );
}

function fmtTotals(t: PeriodTotals) {
  return {
    spend: `${t.spend.toFixed(2)} €`,
    liters: `${t.liters.toFixed(1)} L`,
    co2Kg: `${t.co2Kg.toFixed(1)} kg`,
  };
}

export default async function EstadisticasPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const trips = await prisma.trip.findMany({
    where: { userId },
    select: { createdAt: true, distanceKm: true, isRoundTrip: true, consumptionL100: true, totalCost: true, fuelType: true },
  });

  const stats = aggregateTripStats(trips, new Date());
  const thisMonth = fmtTotals(stats.thisMonth);
  const ytd = fmtTotals(stats.ytd);

  return (
    <>
      <h1 className="text-2xl font-semibold">Estadísticas</h1>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-medium">Este mes</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Gasto" value={thisMonth.spend} pct={stats.deltaPct.spend} />
          <StatCard label="Litros consumidos" value={thisMonth.liters} pct={stats.deltaPct.liters} />
          <StatCard label="CO2 emitido" value={thisMonth.co2Kg} pct={stats.deltaPct.co2Kg} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-medium">Este año</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <YearCard label="Gasto total" value={ytd.spend} />
          <YearCard label="Litros totales" value={ytd.liters} />
          <YearCard label="CO2 total emitido" value={ytd.co2Kg} />
        </div>
      </div>
    </>
  );
}
