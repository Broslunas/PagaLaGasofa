import "server-only"

import { lt, sql } from "drizzle-orm"

import { getDb } from "@/db"
import { rateLimits } from "@/db/schema"

interface Options {
  /** Nombre del endpoint; forma parte de la clave. */
  name: string
  limit: number
  windowSec: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

async function hash(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("")
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || request.headers.get("x-real-ip") || "unknown"
}

// Respaldo en memoria cuando no hay base de datos (desarrollo sin DATABASE_URL).
const memory = new Map<string, { windowStart: number; count: number }>()

/**
 * Límite de ventana fija respaldado por Postgres, válido entre instancias serverless.
 * No guarda la IP en claro. Si la base de datos falla, deja pasar (fail-open) para no
 * tumbar el servicio por una dependencia secundaria.
 */
export async function rateLimit(request: Request, { name, limit, windowSec }: Options): Promise<RateLimitResult> {
  const nowMs = Date.now()
  const windowMs = windowSec * 1000
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs
  const retryAfterSec = Math.max(1, Math.ceil((windowStartMs + windowMs - nowMs) / 1000))
  const key = `${name}:${await hash(clientIp(request))}`

  let count: number
  try {
    const db = getDb()
    const [row] = await db
      .insert(rateLimits)
      .values({ key, windowStart: new Date(windowStartMs) })
      .onConflictDoUpdate({
        target: [rateLimits.key, rateLimits.windowStart],
        set: { count: sql`${rateLimits.count} + 1` },
      })
      .returning({ count: rateLimits.count })
    count = row.count

    // Limpieza oportunista de ventanas antiguas (~1 de cada 100 peticiones).
    if (Math.random() < 0.01) {
      void db
        .delete(rateLimits)
        .where(lt(rateLimits.windowStart, new Date(nowMs - 24 * 3600 * 1000)))
        .catch(() => {})
    }
  } catch (error) {
    if (process.env.DATABASE_URL) console.error("rateLimit: error de base de datos", error)
    const entry = memory.get(key)
    count = entry && entry.windowStart === windowStartMs ? entry.count + 1 : 1
    memory.set(key, { windowStart: windowStartMs, count })
    if (memory.size > 5000) memory.clear()
  }

  return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSec }
}

export function tooManyRequests(result: RateLimitResult) {
  return Response.json(
    { error: "Demasiadas peticiones. Inténtalo de nuevo en unos segundos." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } },
  )
}
