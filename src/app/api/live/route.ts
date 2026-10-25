import { NextResponse, type NextRequest } from "next/server"

import { getDb } from "@/db"
import { liveShares } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { expiryFrom, startSchema } from "@/lib/live/logic"
import { activeLiveForTrip, liveCookieName } from "@/lib/live/server"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { generateManageToken, generateShareId, hashToken } from "@/lib/tokens"
import { requireManagedTrip } from "@/lib/trip/ticket"

/** Crea una sesión de ubicación en vivo (opcionalmente vinculada a un ticket que gestionas). */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { name: "live-start", limit: 10, windowSec: 3600 })
  if (!limit.ok) return tooManyRequests(limit)

  const parsed = startSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })
  const { title, hours, tripShareId } = parsed.data

  let tripId: string | null = null
  if (tripShareId) {
    const managed = await requireManagedTrip(tripShareId)
    if ("error" in managed) return managed.error
    tripId = managed.trip.id
    // Una sola sesión activa por ticket: se reutiliza la que ya hay.
    const existing = await activeLiveForTrip(tripId)
    if (existing) return NextResponse.json({ shareId: existing.shareId, existing: true })
  }

  const user = await getUser()
  const shareId = generateShareId()
  const token = generateManageToken()
  await getDb().insert(liveShares).values({
    shareId,
    manageTokenHash: await hashToken(token),
    userId: user?.id ?? null,
    tripId,
    title: title || null,
    expiresAt: expiryFrom(hours),
  })

  const response = NextResponse.json({ shareId, existing: false }, { status: 201 })
  response.cookies.set(liveCookieName(shareId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
  return response
}
