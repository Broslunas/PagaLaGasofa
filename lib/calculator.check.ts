// Self-check manual — sin framework. Correr con: node lib/calculator.check.ts
import assert from "node:assert/strict";
import { calculateTrip } from "./calculator.ts";

// 100km ida y vuelta = 200km, 6L/100km = 12L, a 1.5€/L = 18€ + 2 peajes = 20€, entre 4 = 5€
const r = calculateTrip({
  distanceKm: 100,
  isRoundTrip: true,
  consumptionL100: 6,
  fuelPricePerLiter: 1.5,
  tollsCost: 2,
  extraCosts: 0,
  passengersCount: 4,
});
assert.equal(r.totalCost, 20);
assert.equal(r.costPerPassenger, 5);
assert.equal(r.driverReceives, 15);

// passengersCount 0 no debe dividir por cero
const r2 = calculateTrip({
  distanceKm: 10,
  isRoundTrip: false,
  consumptionL100: 5,
  fuelPricePerLiter: 1,
  tollsCost: 0,
  extraCosts: 0,
  passengersCount: 0,
});
assert.equal(r2.costPerPassenger, r2.totalCost);

console.log("calculator.ts OK");
