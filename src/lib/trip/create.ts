import "server-only"

import { getDb } from "@/db"
import { tripPassengers, trips } from "@/db/schema"
import { generateManageToken, generateShareId, hashToken } from "@/lib/tokens"

import { calculateTrip } from "./calculator"
import { splitValueFor, toCalculatorInput, type TripDraft } from "./schema"
import { toCents } from "./money"

const ANONYMOUS_TTL_MS = 365 * 24 * 3600 * 1000

/**
 * Calcula el viaje en el servidor (nunca se confía en importes del cliente) y lo guarda
 * junto con sus pasajeros. Devuelve el enlace público y el token secreto de gestión.
 */
export async function createTrip(draft: TripDraft, userId: string | null) {
  const result = calculateTrip(toCalculatorInput(draft))
  const shareId = generateShareId()
  const manageToken = generateManageToken()
  const manageTokenHash = await hashToken(manageToken)

  await getDb().transaction(async (tx) => {
    const [trip] = await tx
      .insert(trips)
      .values({
        shareId,
        manageTokenHash,
        userId,
        title: draft.title || null,
        stops: draft.stops,
        legsKm: draft.legsKm,
        geometry: draft.geometry,
        distanceKm: result.totalKm,
        isRoundTrip: draft.isRoundTrip,
        fuelType: draft.fuelType,
        consumptionPer100km: draft.consumptionPer100km,
        pricePerUnit: draft.pricePerUnit,
        tollsCents: toCents(draft.tolls),
        extras: draft.extras.map((e) => ({ label: e.label, amountCents: toCents(e.amount) })),
        driverPays: draft.driverPays,
        splitMode: draft.split.mode,
        energyUnits: Number(result.energyUnits.toFixed(2)),
        co2Kg: Number(result.co2Kg.toFixed(2)),
        energyCents: result.energyCents,
        totalCents: result.totalCents,
        expiresAt: userId ? null : new Date(Date.now() + ANONYMOUS_TTL_MS),
      })
      .returning({ id: trips.id })

    await tx.insert(tripPassengers).values(
      draft.passengers.map((p, index) => ({
        tripId: trip.id,
        position: index,
        name: p.name,
        pickupStop: p.pickupStop,
        dropoffStop: p.dropoffStop,
        splitValue: splitValueFor(draft, index),
        amountCents: result.amountsCents[index],
      })),
    )
  })

  return { shareId, manageToken, result }
}
