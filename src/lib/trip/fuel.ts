/**
 * Fuente única de verdad de los combustibles. Los ids coinciden con los de
 * MITECO (Fase 7); `electrico` se añade para vehículos eléctricos.
 */
export const FUEL_TYPES = [
  "gasolina95",
  "gasolina98",
  "diesel",
  "dieselPremium",
  "glp",
  "electrico",
] as const

export type FuelType = (typeof FUEL_TYPES)[number]

export const DEFAULT_FUEL_TYPE: FuelType = "gasolina95"

export type EnergyUnit = "l" | "kWh"

interface FuelInfo {
  label: string
  unit: EnergyUnit
  /** kg de CO2 por unidad de energía consumida. */
  co2KgPerUnit: number
}

/**
 * Factores estándar de emisión (kg CO2/L) redondeados. La electricidad usa un
 * valor medio aproximado del mix eléctrico español (kg CO2/kWh).
 */
export const FUEL_INFO: Record<FuelType, FuelInfo> = {
  gasolina95: { label: "Gasolina 95", unit: "l", co2KgPerUnit: 2.31 },
  gasolina98: { label: "Gasolina 98", unit: "l", co2KgPerUnit: 2.31 },
  diesel: { label: "Diésel", unit: "l", co2KgPerUnit: 2.68 },
  dieselPremium: { label: "Diésel premium", unit: "l", co2KgPerUnit: 2.68 },
  glp: { label: "GLP", unit: "l", co2KgPerUnit: 1.51 },
  electrico: { label: "Eléctrico", unit: "kWh", co2KgPerUnit: 0.15 },
}

export function isFuelType(value: unknown): value is FuelType {
  return typeof value === "string" && (FUEL_TYPES as readonly string[]).includes(value)
}

/** Tipo de combustible válido o el predeterminado. */
export function normalizeFuelType(value: unknown): FuelType {
  return isFuelType(value) ? value : DEFAULT_FUEL_TYPE
}
