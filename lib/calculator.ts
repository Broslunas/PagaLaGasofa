// Núcleo puro de cálculo de gasto de viaje — sin I/O, sin dependencias.
export interface CalculatorInput {
  distanceKm: number;
  isRoundTrip: boolean;
  consumptionL100: number; // litros / 100km
  fuelPricePerLiter: number;
  tollsCost: number;
  extraCosts: number;
  passengersCount: number; // total de personas que reparten, incluye al conductor
}

export interface CalculatorResult {
  totalCost: number;
  costPerPassenger: number;
  driverReceives: number; // lo que el conductor cobra del resto (total - su propia parte)
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateTrip(input: CalculatorInput): CalculatorResult {
  const totalDistance = input.distanceKm * (input.isRoundTrip ? 2 : 1);
  const litersUsed = (totalDistance / 100) * input.consumptionL100;
  const fuelCost = litersUsed * input.fuelPricePerLiter;
  const totalCost = fuelCost + input.tollsCost + input.extraCosts;
  const passengers = Math.max(1, input.passengersCount);
  const costPerPassenger = totalCost / passengers;

  return {
    totalCost: round2(totalCost),
    costPerPassenger: round2(costPerPassenger),
    driverReceives: round2(totalCost - costPerPassenger),
  };
}
