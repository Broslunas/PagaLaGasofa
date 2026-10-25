import { describe, expect, it } from "vitest"

import { calculateTrip } from "./calculator"
import { toCalculatorInput, tripDraftSchema, type TripDraft } from "./schema"

const draft: TripDraft = {
  stops: [
    { label: "A", lat: 40, lng: -3 },
    { label: "B", lat: 41, lng: 2 },
  ],
  legsKm: [600],
  geometry: [
    [-3, 40],
    [2, 41],
  ],
  isRoundTrip: false,
  fuelType: "diesel",
  consumptionPer100km: 5.5,
  pricePerUnit: 1.5,
  tolls: 20,
  extras: [{ label: "Parking", amount: 10 }],
  driverPays: true,
  passengers: [
    { name: "Ana", pickupStop: 0, dropoffStop: 1 },
    { name: "Luis", pickupStop: 0, dropoffStop: 1 },
  ],
  split: { mode: "legs" },
}

describe("tripDraftSchema", () => {
  it("acepta un borrador válido y lo convierte para la calculadora", () => {
    const parsed = tripDraftSchema.parse(draft)
    const result = calculateTrip(toCalculatorInput(parsed))
    expect(result.totalCents).toBe(4950 + 2000 + 1000)
  })

  it.each([
    ["legsKm no coincide con las paradas", { legsKm: [1, 2] }],
    ["conductor que no hace todo el viaje", { passengers: [{ name: "Ana", pickupStop: 0, dropoffStop: 1 }, { name: "B", pickupStop: 0, dropoffStop: 2 }] }],
    ["nombre vacío", { passengers: [{ name: " ", pickupStop: 0, dropoffStop: 1 }] }],
    ["combustible desconocido", { fuelType: "agua" }],
    ["porcentajes con distinto número", { split: { mode: "percent", percents: [100] } }],
    ["latitud fuera de rango", { stops: [{ label: "A", lat: 99, lng: 0 }, { label: "B", lat: 0, lng: 0 }] }],
    ["precio negativo", { pricePerUnit: -1 }],
  ])("rechaza %s", (_name, patch) => {
    expect(tripDraftSchema.safeParse({ ...draft, ...patch }).success).toBe(false)
  })
})
