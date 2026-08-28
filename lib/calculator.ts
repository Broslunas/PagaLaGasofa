// Núcleo puro de cálculo de gasto de viaje — sin I/O, sin dependencias.
//
// Un viaje tiene una lista ordenada de "stops": [origen, ...paradas, destino],
// índices 0..N. legsKm[i] es la distancia del tramo entre stop i y stop i+1.
// Cada pasajero va montado en los tramos [pickupStop, dropoffStop).
export interface CalculatorPassenger {
  pickupStop: number;
  dropoffStop: number;
}

export interface CalculatorInput {
  legsKm: number[]; // uno por tramo; sin paradas es [distanceKm]
  isRoundTrip: boolean;
  consumptionL100: number; // litros / 100km
  fuelPricePerLiter: number;
  tollsCost: number;
  extraCosts: number;
  passengers: CalculatorPassenger[]; // el conductor es passengers[0], normalmente 0..legsKm.length
}

export interface CalculatorResult {
  totalCost: number;
  amounts: number[]; // uno por pasajero, mismo orden que el input
  driverReceives: number; // lo que el conductor cobra del resto (total - su propia parte)
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateTrip(input: CalculatorInput): CalculatorResult {
  const roundTripFactor = input.isRoundTrip ? 2 : 1;
  const passengers = input.passengers.length > 0 ? input.passengers : [{ pickupStop: 0, dropoffStop: 1 }];

  const legFuelCosts = input.legsKm.map(
    (km) => ((km * roundTripFactor) / 100) * input.consumptionL100 * input.fuelPricePerLiter
  );
  const totalFuelCost = legFuelCosts.reduce((a, b) => a + b, 0);
  const totalCost = totalFuelCost + input.tollsCost + input.extraCosts;
  const flatShare = (input.tollsCost + input.extraCosts) / passengers.length;

  const fuelShares = new Array(passengers.length).fill(0);
  legFuelCosts.forEach((legCost, leg) => {
    const onboard = passengers
      .map((p, i) => (p.pickupStop <= leg && p.dropoffStop > leg ? i : -1))
      .filter((i) => i !== -1);
    // El conductor siempre va de punta a punta, así que onboard nunca está vacío.
    const share = legCost / Math.max(1, onboard.length);
    onboard.forEach((i) => (fuelShares[i] += share));
  });

  const amounts = fuelShares.map((fuel) => round2(fuel + flatShare));
  const driverReceives = totalCost - amounts[0];

  return {
    totalCost: round2(totalCost),
    amounts,
    driverReceives: round2(driverReceives),
  };
}
