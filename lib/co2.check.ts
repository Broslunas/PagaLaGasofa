// Self-check manual — sin framework. Correr con: node lib/co2.check.ts
import assert from "node:assert/strict";
import { co2KgForLiters, co2ForTrip } from "./co2.ts";

assert.equal(co2KgForLiters(10, "gasolina95"), 23.1);
assert.equal(co2KgForLiters(10, "diesel"), 26.8);
assert.equal(co2KgForLiters(10, undefined), co2KgForLiters(10, "gasolina95")); // fallback

// 100km ida y vuelta = 200km, 6L/100km = 12L, gasolina95 (2.31 kg/L) = 27.72kg
const trip = co2ForTrip({ legsKm: [100], isRoundTrip: true, consumptionL100: 6, fuelType: "gasolina95" });
assert.equal(trip.totalKm, 200);
assert.equal(trip.liters, 12);
assert.equal(trip.co2Kg, 27.72);

// Solo ida, con parada intermedia (dos tramos de 50km).
const oneWay = co2ForTrip({ legsKm: [50, 50], isRoundTrip: false, consumptionL100: 6, fuelType: "diesel" });
assert.equal(oneWay.totalKm, 100);
assert.equal(oneWay.liters, 6);
assert.ok(Math.abs(oneWay.co2Kg - 16.08) < 1e-9);

console.log("co2.check.ts OK");
