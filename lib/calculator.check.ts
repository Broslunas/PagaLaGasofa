// Self-check manual — sin framework. Correr con: node lib/calculator.check.ts
import assert from "node:assert/strict";
import { calculateTrip } from "./calculator.ts";

// Sin paradas: debe reproducir el reparto plano de siempre.
// 100km ida y vuelta = 200km, 6L/100km = 12L, a 1.5€/L = 18€ + 2 peajes = 20€, entre 4 = 5€
const flat = calculateTrip({
  legsKm: [100],
  isRoundTrip: true,
  consumptionL100: 6,
  fuelPricePerLiter: 1.5,
  tollsCost: 2,
  extraCosts: 0,
  passengers: [
    { pickupStop: 0, dropoffStop: 1 },
    { pickupStop: 0, dropoffStop: 1 },
    { pickupStop: 0, dropoffStop: 1 },
    { pickupStop: 0, dropoffStop: 1 },
  ],
});
assert.equal(flat.totalCost, 20);
assert.deepEqual(flat.amounts, [5, 5, 5, 5]);
assert.equal(flat.driverReceives, 15);

// Con parada intermedia: A -> parada -> B, 50km cada tramo, solo ida.
// 6L/100km, 1€/L, sin peajes/extra -> 3€ por tramo, 6€ total.
// Conductor (0->2) va en ambos tramos. Pasajero1 (0->2) igual.
// Pasajero2 sube en la parada (1->2): solo paga el 2º tramo.
const withStop = calculateTrip({
  legsKm: [50, 50],
  isRoundTrip: false,
  consumptionL100: 6,
  fuelPricePerLiter: 1,
  tollsCost: 0,
  extraCosts: 0,
  passengers: [
    { pickupStop: 0, dropoffStop: 2 }, // conductor
    { pickupStop: 0, dropoffStop: 2 },
    { pickupStop: 1, dropoffStop: 2 },
  ],
});
assert.equal(withStop.totalCost, 6);
// Tramo 1 (3€) repartido entre 2 (conductor+pasajero1) = 1.5€ c/u.
// Tramo 2 (3€) repartido entre 3 = 1€ c/u.
assert.deepEqual(withStop.amounts, [2.5, 2.5, 1]);
assert.equal(withStop.driverReceives, 3.5);

// passengers vacío no debe dividir por cero
const empty = calculateTrip({
  legsKm: [10],
  isRoundTrip: false,
  consumptionL100: 5,
  fuelPricePerLiter: 1,
  tollsCost: 0,
  extraCosts: 0,
  passengers: [],
});
assert.equal(empty.amounts[0], empty.totalCost);

console.log("calculator.ts OK");
