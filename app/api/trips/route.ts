import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateTrip } from "@/lib/calculator";

// Recalcula el total en servidor con calculateTrip — nunca confiar en totales
// que mande el cliente, solo en los inputs crudos (distancias por tramo ya
// venían de OSRM vía /api/distance, aquí solo se confía en esos km).
export async function POST(request: Request) {
  const body = await request.json();
  const {
    title,
    origin,
    destination,
    originLat,
    originLon,
    destLat,
    destLon,
    waypoints,
    geometry,
    legsKm,
    isRoundTrip,
    consumptionL100,
    fuelPricePerLiter,
    tollsCost,
    extraCosts,
    passengers,
  } = body;

  if (typeof origin !== "string" || !origin.trim() || typeof destination !== "string" || !destination.trim()) {
    return Response.json({ error: "Faltan origen/destino" }, { status: 400 });
  }
  const stops = Array.isArray(waypoints) ? waypoints : [];
  const stopsCount = stops.length + 2;

  if (!Array.isArray(legsKm) || legsKm.length !== stopsCount - 1 || legsKm.some((km) => typeof km !== "number" || km < 0)) {
    return Response.json({ error: "Distancias por tramo inválidas" }, { status: 400 });
  }
  // Redondeo a 1 decimal: sumar floats ya redondeados (25.2+25.2+25.2) arrastra
  // basura de coma flotante (75.60000000000001) que se ve feo en el ticket.
  const distanceKm = Math.round(legsKm.reduce((a: number, b: number) => a + b, 0) * 10) / 10;
  if (distanceKm <= 0) {
    return Response.json({ error: "Distancia inválida" }, { status: 400 });
  }
  if (!Array.isArray(passengers) || passengers.length < 1) {
    return Response.json({ error: "Falta al menos un pasajero" }, { status: 400 });
  }

  // El conductor (índice 0) siempre hace la ruta completa, sin importar lo que mande el cliente.
  const boarding = passengers.map((p: { pickupStop?: number; dropoffStop?: number }, i: number) => {
    if (i === 0) return { pickupStop: 0, dropoffStop: stopsCount - 1 };
    const pickupStop = Number.isInteger(p.pickupStop) ? (p.pickupStop as number) : 0;
    const dropoffStop = Number.isInteger(p.dropoffStop) ? (p.dropoffStop as number) : stopsCount - 1;
    return { pickupStop, dropoffStop };
  });
  const validBoarding = boarding.every(
    (b) => b.pickupStop >= 0 && b.dropoffStop <= stopsCount - 1 && b.pickupStop < b.dropoffStop
  );
  if (!validBoarding) {
    return Response.json({ error: "Parada de subida/bajada inválida" }, { status: 400 });
  }

  const result = calculateTrip({
    legsKm,
    isRoundTrip: !!isRoundTrip,
    consumptionL100: Number(consumptionL100) || 0,
    fuelPricePerLiter: Number(fuelPricePerLiter) || 0,
    tollsCost: Number(tollsCost) || 0,
    extraCosts: Number(extraCosts) || 0,
    passengers: boarding,
  });

  const names = passengers.map((p: { name?: unknown }, i: number) => {
    const trimmed = typeof p.name === "string" ? p.name.trim() : "";
    if (trimmed) return trimmed;
    return i === 0 ? "Conductor" : `Persona ${i + 1}`;
  });

  const session = await auth();

  const trip = await prisma.trip.create({
    data: {
      userId: session?.user?.id,
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      origin,
      destination,
      originLat: typeof originLat === "number" ? originLat : null,
      originLon: typeof originLon === "number" ? originLon : null,
      destLat: typeof destLat === "number" ? destLat : null,
      destLon: typeof destLon === "number" ? destLon : null,
      geometry: typeof geometry === "string" ? geometry : null,
      waypoints: stops.map((w: { label?: string; lat: number; lon: number }) => ({
        label: typeof w.label === "string" ? w.label : "",
        lat: w.lat,
        lon: w.lon,
      })),
      distanceKm,
      isRoundTrip: !!isRoundTrip,
      consumptionL100: Number(consumptionL100) || 0,
      fuelPricePerLiter: Number(fuelPricePerLiter) || 0,
      tollsCost: Number(tollsCost) || 0,
      extraCosts: Number(extraCosts) || 0,
      passengersCount: passengers.length,
      totalCost: result.totalCost,
      costPerPassenger: result.totalCost / passengers.length,
      driverReceives: result.driverReceives,
      passengers: names.map((name: string, i: number) => ({
        name,
        amount: result.amounts[i],
        hasPaid: false,
        pickupStop: boarding[i].pickupStop,
        dropoffStop: boarding[i].dropoffStop,
      })),
    },
  });

  return Response.json({ shareId: trip.shareId }, { status: 201 });
}
