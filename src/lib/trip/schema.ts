import { z } from "zod"

import type { SplitMode, TripInput } from "./calculator"
import { FUEL_TYPES } from "./fuel"

export const LIMITS = {
  stops: { min: 2, max: 10 },
  passengers: { min: 1, max: 12 },
  extras: 10,
  geometryPoints: 20_000,
  maxLegKm: 6_000,
} as const

const finite = z.number().finite()

export const stopSchema = z.object({
  label: z.string().trim().min(1).max(160),
  lat: finite.min(-90).max(90),
  lng: finite.min(-180).max(180),
})

export const passengerSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre").max(40),
  pickupStop: z.number().int().min(0),
  dropoffStop: z.number().int().min(1),
})

export const splitSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("legs") }),
  z.object({ mode: z.literal("equal") }),
  z.object({ mode: z.literal("percent"), percents: z.array(finite.min(0).max(100)).max(LIMITS.passengers.max) }),
  z.object({ mode: z.literal("manual"), amounts: z.array(finite.min(0).max(100_000)).max(LIMITS.passengers.max) }),
])

/** Datos que el cliente envía para crear un viaje. Los importes se recalculan en el servidor. */
export const tripDraftSchema = z
  .object({
    title: z.string().trim().max(80).optional(),
    stops: z.array(stopSchema).min(LIMITS.stops.min).max(LIMITS.stops.max),
    legsKm: z.array(finite.min(0).max(LIMITS.maxLegKm)).min(1).max(LIMITS.stops.max - 1),
    geometry: z
      .array(z.tuple([finite.min(-180).max(180), finite.min(-90).max(90)]))
      .max(LIMITS.geometryPoints),
    isRoundTrip: z.boolean(),
    fuelType: z.enum(FUEL_TYPES),
    consumptionPer100km: finite.min(0.1).max(100),
    pricePerUnit: finite.min(0).max(10),
    tolls: finite.min(0).max(10_000),
    extras: z
      .array(z.object({ label: z.string().trim().min(1).max(40), amount: finite.min(0).max(100_000) }))
      .max(LIMITS.extras),
    driverPays: z.boolean(),
    passengers: z.array(passengerSchema).min(LIMITS.passengers.min).max(LIMITS.passengers.max),
    split: splitSchema,
  })
  .superRefine((draft, ctx) => {
    if (draft.legsKm.length !== draft.stops.length - 1) {
      ctx.addIssue({ code: "custom", path: ["legsKm"], message: "Un tramo por cada par de paradas" })
    }
    const legs = draft.legsKm.length
    draft.passengers.forEach((p, i) => {
      if (p.pickupStop >= p.dropoffStop || p.dropoffStop > legs) {
        ctx.addIssue({ code: "custom", path: ["passengers", i], message: "Paradas no válidas" })
      }
    })
    const driver = draft.passengers[0]
    if (driver && (driver.pickupStop !== 0 || driver.dropoffStop !== legs)) {
      ctx.addIssue({ code: "custom", path: ["passengers", 0], message: "El conductor hace todo el viaje" })
    }
    const n = draft.passengers.length
    if (draft.split.mode === "percent" && draft.split.percents.length !== n) {
      ctx.addIssue({ code: "custom", path: ["split"], message: "Un porcentaje por pasajero" })
    }
    if (draft.split.mode === "manual" && draft.split.amounts.length !== n) {
      ctx.addIssue({ code: "custom", path: ["split"], message: "Un importe por pasajero" })
    }
  })

export type TripDraft = z.infer<typeof tripDraftSchema>

export function toCalculatorInput(draft: TripDraft): TripInput {
  return {
    legsKm: draft.legsKm,
    isRoundTrip: draft.isRoundTrip,
    fuelType: draft.fuelType,
    consumptionPer100km: draft.consumptionPer100km,
    pricePerUnit: draft.pricePerUnit,
    tolls: draft.tolls,
    extras: draft.extras,
    passengers: draft.passengers.map(({ pickupStop, dropoffStop }) => ({ pickupStop, dropoffStop })),
    driverPays: draft.driverPays,
    split: draft.split as SplitMode,
  }
}

/** Valor guardado por pasajero según el modo (porcentaje o euros). */
export function splitValueFor(draft: TripDraft, index: number): number | null {
  if (draft.split.mode === "percent") return draft.split.percents[index]
  if (draft.split.mode === "manual") return draft.split.amounts[index]
  return null
}
