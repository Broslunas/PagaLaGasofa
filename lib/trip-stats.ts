// Import relativo con extensión (no el alias "@/lib/co2"): así trip-stats.ts
// se puede ejecutar directo con `node` para el self-check, igual que
// calculator.check.ts hace con calculator.ts.
import { co2KgForLiters } from "./co2.ts";

export interface TripForStats {
  createdAt: Date;
  distanceKm: number;
  isRoundTrip: boolean;
  consumptionL100: number;
  totalCost: number;
  fuelType?: string | null;
}

export interface PeriodTotals {
  spend: number;
  liters: number;
  co2Kg: number;
}

export interface TripStats {
  thisMonth: PeriodTotals;
  lastMonth: PeriodTotals;
  ytd: PeriodTotals;
  // null = sin mes anterior con datos para comparar (evita +Infinity%)
  deltaPct: { spend: number | null; liters: number | null; co2Kg: number | null };
}

function litersFor(trip: TripForStats): number {
  return (trip.distanceKm / 100) * trip.consumptionL100 * (trip.isRoundTrip ? 2 : 1);
}

function sumPeriod(trips: TripForStats[]): PeriodTotals {
  return trips.reduce(
    (acc, t) => {
      const liters = litersFor(t);
      acc.spend += t.totalCost;
      acc.liters += liters;
      acc.co2Kg += co2KgForLiters(liters, t.fuelType);
      return acc;
    },
    { spend: 0, liters: 0, co2Kg: 0 }
  );
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function aggregateTripStats(trips: TripForStats[], now: Date): TripStats {
  const y = now.getFullYear();
  const m = now.getMonth();
  const lastMonthDate = new Date(y, m - 1, 1);

  const inMonth = (d: Date, year: number, month: number) => d.getFullYear() === year && d.getMonth() === month;

  const thisMonthTrips = trips.filter((t) => inMonth(t.createdAt, y, m));
  const lastMonthTrips = trips.filter((t) => inMonth(t.createdAt, lastMonthDate.getFullYear(), lastMonthDate.getMonth()));
  const ytdTrips = trips.filter((t) => t.createdAt.getFullYear() === y);

  const thisMonth = sumPeriod(thisMonthTrips);
  const lastMonth = sumPeriod(lastMonthTrips);
  const ytd = sumPeriod(ytdTrips);

  return {
    thisMonth,
    lastMonth,
    ytd,
    deltaPct: {
      spend: pct(thisMonth.spend, lastMonth.spend),
      liters: pct(thisMonth.liters, lastMonth.liters),
      co2Kg: pct(thisMonth.co2Kg, lastMonth.co2Kg),
    },
  };
}
