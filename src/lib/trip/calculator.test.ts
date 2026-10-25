import { describe, expect, it } from "vitest"

import { calculateTrip, TripCalculationError, type TripInput } from "./calculator"

const base: TripInput = {
  legsKm: [100],
  isRoundTrip: true,
  fuelType: "gasolina95",
  consumptionPer100km: 6,
  pricePerUnit: 1.5,
  tolls: 2,
  extras: [],
  passengers: Array.from({ length: 4 }, () => ({ pickupStop: 0, dropoffStop: 1 })),
  driverPays: true,
  split: { mode: "legs" },
}

describe("calculateTrip · reparto por tramos", () => {
  it("sin paradas reparte a partes iguales", () => {
    // 200 km · 6 l/100 km = 12 l · 1,5 €/l = 18 € + 2 € peajes = 20 €
    const r = calculateTrip(base)
    expect(r.totalCost).toBe(20)
    expect(r.amounts).toEqual([5, 5, 5, 5])
    expect(r.driverReceives).toBe(15)
    expect(r.totalKm).toBe(200)
    expect(r.energyUnits).toBeCloseTo(12)
  })

  it("con parada intermedia cada pasajero paga solo sus tramos", () => {
    const r = calculateTrip({
      ...base,
      legsKm: [50, 50],
      isRoundTrip: false,
      pricePerUnit: 1,
      tolls: 0,
      passengers: [
        { pickupStop: 0, dropoffStop: 2 },
        { pickupStop: 0, dropoffStop: 2 },
        { pickupStop: 1, dropoffStop: 2 },
      ],
    })
    expect(r.totalCost).toBe(6)
    expect(r.amounts).toEqual([2.5, 2.5, 1])
    expect(r.driverReceives).toBe(3.5)
  })

  it("los extras con concepto suman al total y se reparten", () => {
    const r = calculateTrip({
      ...base,
      tolls: 0,
      extras: [
        { label: "Parking", amount: 4 },
        { label: "Lavado", amount: 6 },
      ],
    })
    expect(r.extrasCents).toBe(1000)
    expect(r.totalCost).toBe(28)
    expect(r.amounts).toEqual([7, 7, 7, 7])
  })

  it("la suma de importes siempre iguala el total, aunque no divida exacto", () => {
    const r = calculateTrip({
      ...base,
      legsKm: [33.3],
      pricePerUnit: 1.639,
      passengers: [
        { pickupStop: 0, dropoffStop: 1 },
        { pickupStop: 0, dropoffStop: 1 },
        { pickupStop: 0, dropoffStop: 1 },
      ],
    })
    expect(r.amountsCents.reduce((a, b) => a + b, 0)).toBe(r.totalCents)
    expect(r.balanceCents).toBe(0)
  })

  it("solo el conductor: paga todo y no cobra nada", () => {
    const r = calculateTrip({ ...base, passengers: [{ pickupStop: 0, dropoffStop: 1 }] })
    expect(r.amountsCents).toEqual([r.totalCents])
    expect(r.driverReceivesCents).toBe(0)
  })
})

describe("calculateTrip · conductor invitado", () => {
  it("el conductor no paga y el resto cubre todo", () => {
    const r = calculateTrip({ ...base, driverPays: false })
    expect(r.amounts[0]).toBe(0)
    expect(r.amountsCents.reduce((a, b) => a + b, 0)).toBe(r.totalCents)
    expect(r.amounts.slice(1)).toEqual([6.67, 6.67, 6.66])
    expect(r.driverReceives).toBe(20)
  })

  it("un tramo sin pasajeros se reparte entre quienes pagan", () => {
    const r = calculateTrip({
      ...base,
      legsKm: [50, 50],
      isRoundTrip: false,
      pricePerUnit: 1,
      tolls: 0,
      driverPays: false,
      passengers: [
        { pickupStop: 0, dropoffStop: 2 },
        { pickupStop: 1, dropoffStop: 2 },
      ],
    })
    // Tramo 1 (3 €) solo lo hace el conductor: pasa al único que paga.
    expect(r.amounts).toEqual([0, 6])
  })

  it("con un solo ocupante el conductor paga igualmente", () => {
    const r = calculateTrip({
      ...base,
      driverPays: false,
      passengers: [{ pickupStop: 0, dropoffStop: 1 }],
    })
    expect(r.amountsCents).toEqual([r.totalCents])
  })
})

describe("calculateTrip · otros modos de reparto", () => {
  it("equal reparte todo a partes iguales ignorando tramos", () => {
    const r = calculateTrip({
      ...base,
      legsKm: [50, 50],
      isRoundTrip: false,
      split: { mode: "equal" },
      passengers: [
        { pickupStop: 0, dropoffStop: 2 },
        { pickupStop: 1, dropoffStop: 2 },
      ],
    })
    expect(r.amounts[0]).toBe(r.amounts[1])
  })

  it("percent aplica porcentajes sobre el total", () => {
    const r = calculateTrip({
      ...base,
      passengers: base.passengers.slice(0, 2),
      split: { mode: "percent", percents: [25, 75] },
    })
    expect(r.amounts).toEqual([5, 15])
  })

  it("percent exige sumar 100", () => {
    expect(() =>
      calculateTrip({
        ...base,
        passengers: base.passengers.slice(0, 2),
        split: { mode: "percent", percents: [25, 50] },
      }),
    ).toThrow(TripCalculationError)
  })

  it("manual respeta los importes y devuelve el saldo pendiente", () => {
    const r = calculateTrip({
      ...base,
      passengers: base.passengers.slice(0, 2),
      split: { mode: "manual", amounts: [8, 7] },
    })
    expect(r.amounts).toEqual([8, 7])
    expect(r.balanceCents).toBe(500)
    expect(r.driverReceives).toBe(12)
  })
})

describe("calculateTrip · eléctricos", () => {
  it("usa kWh y precio por kWh", () => {
    const r = calculateTrip({
      ...base,
      fuelType: "electrico",
      isRoundTrip: false,
      consumptionPer100km: 16,
      pricePerUnit: 0.25,
      tolls: 0,
    })
    expect(r.energyUnits).toBeCloseTo(16)
    expect(r.totalCost).toBe(4)
    expect(r.co2Kg).toBeCloseTo(16 * 0.15)
  })
})

describe("calculateTrip · validación", () => {
  it.each([
    ["sin tramos", { legsKm: [] }],
    ["distancia negativa", { legsKm: [-5] }],
    ["consumo NaN", { consumptionPer100km: NaN }],
    ["precio negativo", { pricePerUnit: -1 }],
    ["sin pasajeros", { passengers: [] }],
    ["parada fuera de rango", { passengers: [{ pickupStop: 0, dropoffStop: 5 }] }],
    ["subida tras bajada", { passengers: [{ pickupStop: 1, dropoffStop: 1 }] }],
    ["extra negativo", { extras: [{ label: "x", amount: -1 }] }],
  ] as const)("rechaza %s", (_name, patch) => {
    expect(() => calculateTrip({ ...base, ...patch } as TripInput)).toThrow(TripCalculationError)
  })

  it("la suma siempre cuadra con muchos escenarios aleatorios", () => {
    let seed = 7
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32
    for (let i = 0; i < 300; i++) {
      const legs = 1 + Math.floor(rand() * 4)
      const passengers = Array.from({ length: 1 + Math.floor(rand() * 6) }, (_, idx) => {
        if (idx === 0) return { pickupStop: 0, dropoffStop: legs }
        const pickup = Math.floor(rand() * legs)
        return { pickupStop: pickup, dropoffStop: pickup + 1 + Math.floor(rand() * (legs - pickup)) }
      })
      const r = calculateTrip({
        ...base,
        legsKm: Array.from({ length: legs }, () => rand() * 200),
        isRoundTrip: rand() > 0.5,
        consumptionPer100km: rand() * 12,
        pricePerUnit: rand() * 2.2,
        tolls: rand() * 30,
        driverPays: rand() > 0.3,
        passengers,
      })
      expect(r.amountsCents.reduce((a, b) => a + b, 0)).toBe(r.totalCents)
      expect(r.amountsCents.every((c) => c >= 0)).toBe(true)
    }
  })
})
