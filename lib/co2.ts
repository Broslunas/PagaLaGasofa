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

// Misma lógica de ida/vuelta que lib/calculator.ts (roundTripFactor), pero sin
// reparto entre pasajeros — solo distancia total, litros consumidos y CO2.
export function co2ForTrip(input: {
  legsKm: number[];
  isRoundTrip: boolean;
  consumptionL100: number;
  fuelType?: string | null;
}): { totalKm: number; liters: number; co2Kg: number } {
  const oneWayKm = input.legsKm.reduce((a, b) => a + b, 0);
  const totalKm = oneWayKm * (input.isRoundTrip ? 2 : 1);
  const liters = (totalKm / 100) * input.consumptionL100;
  return { totalKm, liters, co2Kg: co2KgForLiters(liters, input.fuelType) };
}
