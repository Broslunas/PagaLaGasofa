import { z } from "zod"

import { FUEL_TYPES } from "@/lib/trip/fuel"

export const vehicleInputSchema = z.object({
  name: z.string().trim().max(40).nullish(),
  brand: z.string().trim().min(1, "Falta la marca").max(40),
  model: z.string().trim().min(1, "Falta el modelo").max(60),
  year: z.number().int().min(1950).max(2100).nullish(),
  fuelType: z.enum(FUEL_TYPES),
  consumptionPer100km: z.number().finite().min(0.1).max(100),
  isDefault: z.boolean().optional(),
})

export type VehicleInput = z.infer<typeof vehicleInputSchema>
