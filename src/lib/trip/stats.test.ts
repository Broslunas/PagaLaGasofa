import { describe, expect, it } from "vitest"

import { aggregateTripStats, monthlySeries, yearMonthInZone, type TripForStats } from "./stats"

const trip = (iso: string, over: Partial<TripForStats> = {}): TripForStats => ({
  createdAt: new Date(iso),
  distanceKm: 100,
  isRoundTrip: false,
  consumptionPer100km: 6,
  totalCost: 10,
  fuelType: "gasolina95",
  ...over,
})

describe("stats", () => {
  const now = new Date("2026-10-25T10:00:00Z")

  it("agrega mes actual, anterior y año", () => {
    const s = aggregateTripStats(
      [trip("2026-10-02T10:00:00Z"), trip("2026-09-10T10:00:00Z"), trip("2026-01-05T10:00:00Z"), trip("2025-10-05T10:00:00Z")],
      now,
    )
    expect(s.thisMonth.spend).toBe(10)
    expect(s.lastMonth.spend).toBe(10)
    expect(s.ytd.spend).toBe(30)
    expect(s.deltaPct.spend).toBe(0)
    expect(s.thisMonth.energyUnits).toBeCloseTo(6)
    expect(s.thisMonth.co2Kg).toBeCloseTo(6 * 2.31)
  })

  it("el mes anterior de enero es diciembre del año previo", () => {
    const s = aggregateTripStats([trip("2025-12-20T10:00:00Z")], new Date("2026-01-15T10:00:00Z"))
    expect(s.lastMonth.spend).toBe(10)
    expect(s.ytd.spend).toBe(0)
  })

  it("delta nulo si no hay mes anterior con datos", () => {
    const s = aggregateTripStats([trip("2026-10-02T10:00:00Z")], now)
    expect(s.deltaPct.spend).toBeNull()
  })

  it("respeta la zona horaria de Madrid en el cambio de mes", () => {
    // 30 sep 22:30 UTC = 1 oct 00:30 en Madrid (CEST, UTC+2)
    expect(yearMonthInZone(new Date("2026-09-30T22:30:00Z"))).toEqual({ year: 2026, month: 10 })
  })

  it("monthlySeries rellena con ceros y mantiene el orden", () => {
    const series = monthlySeries([trip("2026-10-02T10:00:00Z")], now, 3)
    expect(series.map((p) => p.month)).toEqual(["2026-08", "2026-09", "2026-10"])
    expect(series.map((p) => p.trips)).toEqual([0, 0, 1])
  })

  it("monthlySeries cruza el cambio de año", () => {
    const series = monthlySeries([], new Date("2026-02-10T10:00:00Z"), 3)
    expect(series.map((p) => p.month)).toEqual(["2025-12", "2026-01", "2026-02"])
  })
})
