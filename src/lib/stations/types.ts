import type { FuelType } from "@/lib/trip/fuel"

/** Combustibles de los que MITECO publica precio (la electricidad no está en el feed). */
export const STATION_FUELS = ["gasolina95", "gasolina98", "diesel", "dieselPremium", "glp"] as const satisfies readonly FuelType[]
export type StationFuel = (typeof STATION_FUELS)[number]

export const isStationFuel = (v: unknown): v is StationFuel => (STATION_FUELS as readonly string[]).includes(v as string)

export type PriceMap = Record<StationFuel, number | null>

export interface StationDto {
  id: string
  name: string
  brand: string
  address: string
  locality: string
  province: string
  lat: number
  lng: number
  schedule: string
  prices: PriceMap
  /** Solo en búsquedas con punto de referencia. */
  distanceKm?: number
  open: boolean | null
  openLabel: string
}
