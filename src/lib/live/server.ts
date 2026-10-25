import "server-only"

import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { timingSafeEqual } from "node:crypto"
import { cache } from "react"

import { getDb } from "@/db"
import { liveShares, trips, type LiveShare } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { hashToken, SHARE_ID_PATTERN } from "@/lib/tokens"
import { resolveAccess } from "@/lib/trip/ticket"

import { liveState, positionAgeSeconds, speedKmh, type LiveState } from "./logic"

export const liveCookieName = (shareId: string) => `plg_live_${shareId}`

export const loadLive = cache(async (shareId: string): Promise<LiveShare | null> => {
  if (!SHARE_ID_PATTERN.test(shareId)) return null
  const [row] = await getDb().select().from(liveShares).where(eq(liveShares.shareId, shareId)).limit(1)
  return row ?? null
})

const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/**
 * Puede enviar posiciones y parar la sesión: el dispositivo que la creó (cookie),
 * su dueño con cuenta, o quien gestiona el ticket al que está vinculada.
 */
export async function canManageLive(live: LiveShare): Promise<boolean> {
  const [store, user] = await Promise.all([cookies(), getUser()])
  const token = store.get(liveCookieName(live.shareId))?.value
  if (token && sameHash(await hashToken(token), live.manageTokenHash)) return true
  if (user && live.userId && user.id === live.userId) return true
  if (live.tripId) {
    const [trip] = await getDb().select().from(trips).where(eq(trips.id, live.tripId)).limit(1)
    if (trip && (await resolveAccess(trip)).manager) return true
  }
  return false
}

export interface LiveDto {
  shareId: string
  title: string | null
  state: LiveState
  expiresAt: string
  /** Solo mientras la sesión está activa y ya hay posición. */
  position: { lat: number; lng: number; accuracyM: number | null; headingDeg: number | null; speedKmh: number | null; at: string; ageSeconds: number } | null
  trip: { shareId: string; title: string | null; stops: { label: string; lat: number; lng: number }[]; geometry: [number, number][] } | null
}

export async function toLiveDto(live: LiveShare, now = new Date()): Promise<LiveDto> {
  const state = liveState(live, now)
  let trip: LiveDto["trip"] = null
  if (live.tripId && state === "active") {
    const [t] = await getDb().select().from(trips).where(eq(trips.id, live.tripId)).limit(1)
    if (t) trip = { shareId: t.shareId, title: t.title, stops: t.stops, geometry: t.geometry }
  }
  const hasPosition = state === "active" && live.lat !== null && live.lng !== null && live.positionAt !== null
  return {
    shareId: live.shareId,
    title: live.title,
    state,
    expiresAt: live.expiresAt.toISOString(),
    position: hasPosition
      ? {
          lat: live.lat!,
          lng: live.lng!,
          accuracyM: live.accuracyM,
          headingDeg: live.headingDeg,
          speedKmh: speedKmh(live.speedMs),
          at: live.positionAt!.toISOString(),
          ageSeconds: positionAgeSeconds(live.positionAt, now) ?? 0,
        }
      : null,
    trip,
  }
}

/** Sesión activa vinculada a un ticket (para mostrar el acceso desde el propio ticket). */
export async function activeLiveForTrip(tripId: string): Promise<LiveShare | null> {
  const rows = await getDb().select().from(liveShares).where(eq(liveShares.tripId, tripId))
  return rows.find((r) => liveState(r) === "active") ?? null
}
