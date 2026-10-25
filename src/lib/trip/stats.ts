import { FUEL_INFO, normalizeFuelType } from "./fuel"

export interface TripForStats {
  createdAt: Date
  distanceKm: number
  isRoundTrip: boolean
  consumptionPer100km: number
  totalCost: number
  fuelType?: string | null
}

export interface PeriodTotals {
  spend: number
  /** Litros o kWh consumidos. */
  energyUnits: number
  co2Kg: number
}

export interface TripStats {
  thisMonth: PeriodTotals
  lastMonth: PeriodTotals
  ytd: PeriodTotals
  /** `null` = sin periodo anterior con datos (evita +Infinity %). */
  deltaPct: { spend: number | null; energyUnits: number | null; co2Kg: number | null }
}

export const STATS_TIME_ZONE = "Europe/Madrid"

/** Año y mes (1-12) de una fecha en la zona horaria dada. */
export function yearMonthInZone(date: Date, timeZone = STATS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" })
    .formatToParts(date)
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
  }
}

function totalsFor(trip: TripForStats): PeriodTotals {
  const energyUnits =
    (trip.distanceKm / 100) * trip.consumptionPer100km * (trip.isRoundTrip ? 2 : 1)
  const co2Kg = energyUnits * FUEL_INFO[normalizeFuelType(trip.fuelType)].co2KgPerUnit
  return { spend: trip.totalCost, energyUnits, co2Kg }
}

function sum(trips: TripForStats[]): PeriodTotals {
  return trips.reduce<PeriodTotals>(
    (acc, trip) => {
      const t = totalsFor(trip)
      return {
        spend: acc.spend + t.spend,
        energyUnits: acc.energyUnits + t.energyUnits,
        co2Kg: acc.co2Kg + t.co2Kg,
      }
    },
    { spend: 0, energyUnits: 0, co2Kg: 0 },
  )
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export function aggregateTripStats(trips: TripForStats[], now: Date): TripStats {
  const cur = yearMonthInZone(now)
  const prev = cur.month === 1 ? { year: cur.year - 1, month: 12 } : { year: cur.year, month: cur.month - 1 }

  const dated = trips.map((trip) => ({ trip, ym: yearMonthInZone(trip.createdAt) }))
  const pick = (f: (ym: { year: number; month: number }) => boolean) =>
    sum(dated.filter(({ ym }) => f(ym)).map(({ trip }) => trip))

  const thisMonth = pick((ym) => ym.year === cur.year && ym.month === cur.month)
  const lastMonth = pick((ym) => ym.year === prev.year && ym.month === prev.month)
  const ytd = pick((ym) => ym.year === cur.year)

  return {
    thisMonth,
    lastMonth,
    ytd,
    deltaPct: {
      spend: pct(thisMonth.spend, lastMonth.spend),
      energyUnits: pct(thisMonth.energyUnits, lastMonth.energyUnits),
      co2Kg: pct(thisMonth.co2Kg, lastMonth.co2Kg),
    },
  }
}

export interface MonthlyPoint extends PeriodTotals {
  /** `YYYY-MM` */
  month: string
  trips: number
}

/** Serie de los últimos `months` meses (incluido el actual), con ceros en los vacíos. */
export function monthlySeries(trips: TripForStats[], now: Date, months = 12): MonthlyPoint[] {
  const cur = yearMonthInZone(now)
  const points: MonthlyPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const index = cur.year * 12 + (cur.month - 1) - i
    const year = Math.floor(index / 12)
    const month = (index % 12) + 1
    const inMonth = trips.filter((t) => {
      const ym = yearMonthInZone(t.createdAt)
      return ym.year === year && ym.month === month
    })
    points.push({
      month: `${year}-${String(month).padStart(2, "0")}`,
      trips: inMonth.length,
      ...sum(inMonth),
    })
  }
  return points
}
