import "server-only"

import { and, asc, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { cache } from "react"
import { timingSafeEqual } from "node:crypto"

import { getDb } from "@/db"
import { tripPassengers, trips, type Trip, type TripPassengerRow } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { hashToken, SHARE_ID_PATTERN } from "@/lib/tokens"

export type TicketLookup =
  | { status: "ok"; trip: Trip; passengers: TripPassengerRow[] }
  | { status: "expired" }
  | { status: "missing" }

export const manageCookieName = (shareId: string) => `plg_manage_${shareId}`

export const loadTicket = cache(async (shareId: string): Promise<TicketLookup> => {
  if (!SHARE_ID_PATTERN.test(shareId)) return { status: "missing" }
  const db = getDb()
  const [trip] = await db.select().from(trips).where(eq(trips.shareId, shareId)).limit(1)
  if (!trip) return { status: "missing" }
  if (trip.expiresAt && trip.expiresAt.getTime() < Date.now()) return { status: "expired" }
  const passengers = await db
    .select()
    .from(tripPassengers)
    .where(eq(tripPassengers.tripId, trip.id))
    .orderBy(asc(tripPassengers.position))
  return { status: "ok", trip, passengers }
})

const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export interface Access {
  /** Puede marcar pagos, editar y borrar. */
  manager: boolean
  /** Token de gestión del dispositivo (solo si `manager` por cookie); sirve para generar el enlace secreto. */
  manageToken: string | null
  userId: string | null
}

/** Quién es quien mira el ticket: gestor por cookie del dispositivo, o por ser el dueño con cuenta. */
export async function resolveAccess(trip: Trip): Promise<Access> {
  const [store, user] = await Promise.all([cookies(), getUser()])
  const token = store.get(manageCookieName(trip.shareId))?.value ?? null
  const byToken = token ? sameHash(await hashToken(token), trip.manageTokenHash) : false
  const byAccount = Boolean(user && trip.userId && user.id === trip.userId)
  return { manager: byToken || byAccount, manageToken: byToken ? token : null, userId: user?.id ?? null }
}

export async function verifyManageToken(trip: Trip, token: string) {
  return sameHash(await hashToken(token), trip.manageTokenHash)
}

/** Solo para rutas de API: devuelve el ticket si quien llama es gestor. */
export async function requireManagedTrip(shareId: string) {
  const lookup = await loadTicket(shareId)
  if (lookup.status !== "ok") return { error: Response.json({ error: "Ticket no encontrado" }, { status: 404 }) }
  const access = await resolveAccess(lookup.trip)
  if (!access.manager) return { error: Response.json({ error: "No tienes permiso" }, { status: 403 }) }
  return { trip: lookup.trip, passengers: lookup.passengers, access }
}

export async function setPassengerPaid(tripId: string, position: number, hasPaid: boolean) {
  const [row] = await getDb()
    .update(tripPassengers)
    .set({ hasPaid, paidAt: hasPaid ? new Date() : null })
    .where(and(eq(tripPassengers.tripId, tripId), eq(tripPassengers.position, position)))
    .returning()
  return row ?? null
}
