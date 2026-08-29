// CO2 emitido por litro de combustible quemado — factores estándar (kg CO2/L).
// Fuente: guías de conversión de emisiones (DEFA/EPA), valores redondeados.
export const CO2_FACTORS_KG_PER_LITER: Record<string, number> = {
  gasolina95: 2.31,
  gasolina98: 2.31,
  diesel: 2.68,
  dieselPremium: 2.68,
  glp: 1.51,
};

export const DEFAULT_FUEL_TYPE = "gasolina95";

export function co2KgForLiters(liters: number, fuelType?: string | null): number {
  const factor = CO2_FACTORS_KG_PER_LITER[fuelType ?? ""] ?? CO2_FACTORS_KG_PER_LITER[DEFAULT_FUEL_TYPE];
  return liters * factor;
}
