// Lógica pura de la ubicación en vivo: validación, ritmo de envío y estado de la sesión.
import { z } from "zod"

import { haversineKm } from "@/lib/trip/geo"

export const DURATION_OPTIONS_H = [1, 2, 4, 8] as const
export const DEFAULT_DURATION_H = 4
export const MAX_DURATION_H = 12

/** Sin señal: pasado este tiempo sin posición nueva se avisa a quien mira. */
export const STALE_AFTER_S = 90

export const positionSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  accuracy: z.number().finite().min(0).max(100_000).nullish(),
  heading: z.number().finite().min(0).max(360).nullish(),
  /** m/s; 100 m/s ≈ 360 km/h, por encima es un dato absurdo. */
  speed: z.number().finite().min(0).max(100).nullish(),
})
export type PositionInput = z.infer<typeof positionSchema>

export const startSchema = z.object({
  title: z.string().trim().max(60).optional(),
  hours: z.number().int().min(1).max(MAX_DURATION_H).default(DEFAULT_DURATION_H),
  /** `shareId` del ticket al que se vincula (hay que gestionarlo). */
  tripShareId: z.string().regex(/^[0-9A-Za-z]{12}$/).optional(),
})

interface Sample {
  lat: number
  lng: number
  /** ms */
  t: number
}

/**
 * Decide si merece la pena enviar una posición nueva: nunca más a menudo que `minIntervalMs`,
 * enseguida si te has movido lo suficiente y, aunque estés parado, un latido cada `maxSilenceMs`.
 */
export function shouldSendPosition(prev: Sample | null, next: Sample, opts = { minIntervalMs: 5_000, minMoveM: 15, maxSilenceMs: 30_000 }) {
  if (!prev) return true
  const elapsed = next.t - prev.t
  if (elapsed < opts.minIntervalMs) return false
  const movedM = haversineKm(prev.lat, prev.lng, next.lat, next.lng) * 1000
  return movedM >= opts.minMoveM || elapsed >= opts.maxSilenceMs
}

export type LiveState = "active" | "stopped" | "expired"

export function liveState(row: { stoppedAt: Date | null; expiresAt: Date }, now = new Date()): LiveState {
  if (row.stoppedAt) return "stopped"
  return row.expiresAt.getTime() <= now.getTime() ? "expired" : "active"
}

export const positionAgeSeconds = (positionAt: Date | string | null, now = new Date()) =>
  positionAt ? Math.max(0, Math.round((now.getTime() - new Date(positionAt).getTime()) / 1000)) : null

export const isStale = (ageSeconds: number | null) => ageSeconds === null || ageSeconds > STALE_AFTER_S

export const expiryFrom = (hours: number, now = new Date()) => new Date(now.getTime() + hours * 3_600_000)

/** Velocidad en km/h, o null si no hay dato. */
export const speedKmh = (speedMs: number | null | undefined) => (speedMs === null || speedMs === undefined ? null : Math.round(speedMs * 3.6))
