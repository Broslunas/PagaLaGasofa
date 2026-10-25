// Núcleo puro de cálculo del coste de un viaje: sin I/O ni dependencias.
//
// Un viaje es una lista ordenada de paradas [origen, ...paradas, destino] (índices 0..N).
// `legsKm[i]` es la distancia del tramo entre la parada i y la i+1. Cada pasajero
// va a bordo de los tramos [pickupStop, dropoffStop). El pasajero 0 es el conductor.
import { FUEL_INFO, type FuelType } from "./fuel"
import { allocateCents, fromCents, toCents } from "./money"

export interface TripPassenger {
  pickupStop: number
  dropoffStop: number
}

export interface TripExtra {
  label: string
  amount: number
}

export type SplitMode =
  /** Cada uno paga los tramos en los que va a bordo; peajes y extras a partes iguales. */
  | { mode: "legs" }
  /** Todo a partes iguales entre quienes pagan. */
  | { mode: "equal" }
  /** Porcentaje del total por pasajero (mismo orden; suma 100). */
  | { mode: "percent"; percents: number[] }
  /** Importe en euros por pasajero (mismo orden). La diferencia con el total se devuelve en `balanceCents`. */
  | { mode: "manual"; amounts: number[] }

export interface TripInput {
  legsKm: number[]
  isRoundTrip: boolean
  fuelType: FuelType
  /** l/100 km o kWh/100 km según el combustible. */
  consumptionPer100km: number
  /** €/l o €/kWh. */
  pricePerUnit: number
  tolls: number
  extras: TripExtra[]
  passengers: TripPassenger[]
  /** Si es `false`, el conductor va gratis y el resto cubre todo el coste. */
  driverPays: boolean
  split: SplitMode
}

export interface TripResult {
  totalKm: number
  /** Litros o kWh consumidos en total. */
  energyUnits: number
  co2Kg: number
  energyCents: number
  tollsCents: number
  extrasCents: number
  totalCents: number
  /** Importe por pasajero en céntimos, mismo orden que la entrada. */
  amountsCents: number[]
  /** `totalCents` menos lo asignado; solo es distinto de 0 en reparto manual. */
  balanceCents: number
  /** Lo que el conductor cobra del resto: total menos su propia parte. */
  driverReceivesCents: number
  totalCost: number
  amounts: number[]
  driverReceives: number
}

export class TripCalculationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TripCalculationError"
  }
}

const isNonNegative = (n: number) => Number.isFinite(n) && n >= 0

function validate(input: TripInput) {
  const fail = (message: string): never => {
    throw new TripCalculationError(message)
  }
  const legs = input.legsKm.length

  if (legs === 0) fail("El viaje necesita al menos un tramo")
  if (!input.legsKm.every(isNonNegative)) fail("Las distancias deben ser números no negativos")
  if (!isNonNegative(input.consumptionPer100km)) fail("Consumo no válido")
  if (!isNonNegative(input.pricePerUnit)) fail("Precio no válido")
  if (!isNonNegative(input.tolls)) fail("Peajes no válidos")
  if (!input.extras.every((e) => isNonNegative(e.amount))) fail("Importe extra no válido")
  if (input.passengers.length === 0) fail("Se necesita al menos un pasajero (el conductor)")

  for (const p of input.passengers) {
    const ok =
      Number.isInteger(p.pickupStop) &&
      Number.isInteger(p.dropoffStop) &&
      p.pickupStop >= 0 &&
      p.dropoffStop <= legs &&
      p.pickupStop < p.dropoffStop
    if (!ok) fail("Paradas de subida y bajada no válidas")
  }

  const { split } = input
  const n = input.passengers.length
  if (split.mode === "percent") {
    if (split.percents.length !== n || !split.percents.every(isNonNegative)) {
      fail("Porcentajes no válidos")
    }
    const sum = split.percents.reduce((a, b) => a + b, 0)
    if (Math.abs(sum - 100) > 0.01) fail("Los porcentajes deben sumar 100")
  }
  if (split.mode === "manual") {
    if (split.amounts.length !== n || !split.amounts.every(isNonNegative)) {
      fail("Importes manuales no válidos")
    }
  }
}

export function calculateTrip(input: TripInput): TripResult {
  validate(input)

  const { passengers, legsKm } = input
  const factor = input.isRoundTrip ? 2 : 1
  const info = FUEL_INFO[input.fuelType]

  const oneWayKm = legsKm.reduce((a, b) => a + b, 0)
  const totalKm = oneWayKm * factor
  const energyUnits = (totalKm / 100) * input.consumptionPer100km

  // Coste de cada tramo en céntimos exactos; el total de energía es su suma.
  const legCents = legsKm.map((km) =>
    toCents(((km * factor) / 100) * input.consumptionPer100km * input.pricePerUnit),
  )
  const energyCents = legCents.reduce((a, b) => a + b, 0)
  const tollsCents = toCents(input.tolls)
  const extrasCents = input.extras.reduce((sum, e) => sum + toCents(e.amount), 0)
  const totalCents = energyCents + tollsCents + extrasCents
  const flatCents = tollsCents + extrasCents

  // Quién paga: si el conductor va gratis y hay más gente, solo los demás.
  const driverFree = !input.driverPays && passengers.length > 1
  const pays = passengers.map((_, i) => !(driverFree && i === 0))
  const payerCount = pays.filter(Boolean).length

  let amountsCents: number[]
  let balanceCents = 0

  switch (input.split.mode) {
    case "equal": {
      amountsCents = allocateCents(totalCents, pays.map((p) => (p ? 1 : 0)))
      break
    }
    case "percent": {
      amountsCents = allocateCents(totalCents, input.split.percents)
      break
    }
    case "manual": {
      amountsCents = input.split.amounts.map(toCents)
      balanceCents = totalCents - amountsCents.reduce((a, b) => a + b, 0)
      break
    }
    case "legs": {
      // Peso de cada pasajero = su parte de cada tramo + su parte de gastos fijos.
      const weights = passengers.map(() => 0)
      const unassigned: number[] = []
      legCents.forEach((cents, leg) => {
        const onboard = passengers
          .map((p, i) => (pays[i] && p.pickupStop <= leg && p.dropoffStop > leg ? i : -1))
          .filter((i) => i !== -1)
        if (onboard.length === 0) {
          unassigned.push(cents) // tramo en el que solo va quien no paga
          return
        }
        onboard.forEach((i) => (weights[i] += cents / onboard.length))
      })
      const sharedCents = flatCents + unassigned.reduce((a, b) => a + b, 0)
      pays.forEach((p, i) => {
        if (p) weights[i] += sharedCents / payerCount
      })
      amountsCents = allocateCents(totalCents, weights)
      break
    }
  }

  const driverReceivesCents = totalCents - amountsCents[0]

  return {
    totalKm,
    energyUnits,
    co2Kg: energyUnits * info.co2KgPerUnit,
    energyCents,
    tollsCents,
    extrasCents,
    totalCents,
    amountsCents,
    balanceCents,
    driverReceivesCents,
    totalCost: fromCents(totalCents),
    amounts: amountsCents.map(fromCents),
    driverReceives: fromCents(driverReceivesCents),
  }
}
