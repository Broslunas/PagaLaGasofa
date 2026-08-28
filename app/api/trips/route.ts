import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateTrip } from "@/lib/calculator";

// Recalcula el total en servidor con calculateTrip — nunca confiar en totales
// que mande el cliente, solo en los inputs crudos.
export async function POST(request: Request) {
  const body = await request.json();
  const {
    origin,
    destination,
    originLat,
    originLon,
    destLat,
    destLon,
    geometry,
    distanceKm,
    isRoundTrip,
    consumptionL100,
    fuelPricePerLiter,
    tollsCost,
    extraCosts,
    passengerNames,
  } = body;

  if (typeof origin !== "string" || !origin.trim() || typeof destination !== "string" || !destination.trim()) {
    return Response.json({ error: "Faltan origen/destino" }, { status: 400 });
  }
  if (typeof distanceKm !== "number" || distanceKm <= 0) {
    return Response.json({ error: "Distancia inválida" }, { status: 400 });
  }
  if (!Array.isArray(passengerNames) || passengerNames.length < 1) {
    return Response.json({ error: "Falta al menos un pasajero" }, { status: 400 });
  }

  const result = calculateTrip({
    distanceKm,
    isRoundTrip: !!isRoundTrip,
    consumptionL100: Number(consumptionL100) || 0,
    fuelPricePerLiter: Number(fuelPricePerLiter) || 0,
    tollsCost: Number(tollsCost) || 0,
    extraCosts: Number(extraCosts) || 0,
    passengersCount: passengerNames.length,
  });

  const names = passengerNames.map((name: unknown, i: number) => {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (trimmed) return trimmed;
    return i === 0 ? "Conductor" : `Persona ${i + 1}`;
  });

  const session = await auth();

  const trip = await prisma.trip.create({
    data: {
      userId: session?.user?.id,
      origin,
      destination,
      originLat: typeof originLat === "number" ? originLat : null,
      originLon: typeof originLon === "number" ? originLon : null,
      destLat: typeof destLat === "number" ? destLat : null,
      destLon: typeof destLon === "number" ? destLon : null,
      geometry: typeof geometry === "string" ? geometry : null,
      distanceKm,
      isRoundTrip: !!isRoundTrip,
      consumptionL100: Number(consumptionL100) || 0,
      fuelPricePerLiter: Number(fuelPricePerLiter) || 0,
      tollsCost: Number(tollsCost) || 0,
      extraCosts: Number(extraCosts) || 0,
      passengersCount: passengerNames.length,
      totalCost: result.totalCost,
      costPerPassenger: result.costPerPassenger,
      driverReceives: result.driverReceives,
      passengers: names.map((name: string) => ({ name, amount: result.costPerPassenger, hasPaid: false })),
    },
  });

  return Response.json({ shareId: trip.shareId }, { status: 201 });
}
