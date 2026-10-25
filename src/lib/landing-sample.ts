import { calculateTrip } from "@/lib/trip/calculator"

/** Viaje de ejemplo de la landing, calculado con la calculadora real: Madrid → Cuenca → Valencia. */
export const SAMPLE = (() => {
  const result = calculateTrip({
    legsKm: [165, 190],
    isRoundTrip: false,
    fuelType: "gasolina95",
    consumptionPer100km: 5.8,
    pricePerUnit: 1.55,
    tolls: 0,
    extras: [{ label: "Parking", amount: 6 }],
    passengers: [
      { pickupStop: 0, dropoffStop: 2 },
      { pickupStop: 0, dropoffStop: 2 },
      { pickupStop: 1, dropoffStop: 2 },
    ],
    driverPays: true,
    split: { mode: "legs" },
  })
  return {
    from: "Madrid",
    via: "Cuenca",
    to: "Valencia",
    km: 355,
    result,
    people: [
      { name: "Ana", role: "conduce", paid: null as boolean | null },
      { name: "Luis", role: "Madrid → Valencia", paid: true },
      { name: "Eva", role: "Cuenca → Valencia", paid: false },
    ],
  }
})()
