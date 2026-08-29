// Self-check manual — sin framework. Correr con: node lib/trip-stats.check.ts
import assert from "node:assert/strict";
import { aggregateTripStats } from "./trip-stats.ts";

const now = new Date(2026, 7, 15); // 15 ago 2026

const trips = [
  // este mes: 100km, 6L/100km, gasolina95 -> 6L, 6*2.31=13.86kg CO2
  { createdAt: new Date(2026, 7, 1), distanceKm: 100, isRoundTrip: false, consumptionL100: 6, totalCost: 10, fuelType: "gasolina95" },
  // mes pasado: 200km ida y vuelta -> 400km equivalentes, 5L/100km -> 20L, diesel 2.68 -> 53.6kg
  { createdAt: new Date(2026, 6, 10), distanceKm: 200, isRoundTrip: true, consumptionL100: 5, totalCost: 40, fuelType: "diesel" },
  // fuera de año actual, no debe contar en ytd
  { createdAt: new Date(2025, 11, 1), distanceKm: 999, isRoundTrip: false, consumptionL100: 6, totalCost: 999, fuelType: "gasolina95" },
];

const stats = aggregateTripStats(trips, now);

assert.equal(stats.thisMonth.spend, 10);
assert.equal(stats.thisMonth.liters, 6);
assert.ok(Math.abs(stats.thisMonth.co2Kg - 13.86) < 1e-9);

assert.equal(stats.lastMonth.spend, 40);
assert.equal(stats.lastMonth.liters, 20);
assert.ok(Math.abs(stats.lastMonth.co2Kg - 53.6) < 1e-9);

// 2025 excluido del año actual
assert.equal(stats.ytd.spend, 50);

// delta: (10-40)/40 * 100 = -75%
assert.ok(Math.abs((stats.deltaPct.spend as number) - -75) < 1e-9);

// sin mes anterior -> null, no +Infinity
const noPrev = aggregateTripStats([trips[0]], now);
assert.equal(noPrev.deltaPct.spend, null);

// fuelType ausente -> fallback gasolina95 (2.31), no crashea
const noFuel = aggregateTripStats(
  [{ createdAt: now, distanceKm: 100, isRoundTrip: false, consumptionL100: 6, totalCost: 5 }],
  now
);
assert.ok(Math.abs(noFuel.thisMonth.co2Kg - 13.86) < 1e-9);

console.log("trip-stats.ts OK");
