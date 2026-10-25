import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { loadTicket, manageCookieName, verifyManageToken } from "@/lib/trip/ticket"

const bodySchema = z.object({ token: z.string().regex(/^[0-9A-Za-z]{32}$/) })

/** Canjea el token secreto del enlace de gestión por la cookie del dispositivo. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/trips/[shareId]/manage">) {
  const limit = await rateLimit(request, { name: "trip-manage", limit: 20, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  const lookup = await loadTicket((await params).shareId)
  if (!parsed.success || lookup.status !== "ok" || !(await verifyManageToken(lookup.trip, parsed.data.token))) {
    return NextResponse.json({ error: "Enlace de gestión no válido" }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(manageCookieName(lookup.trip.shareId), parsed.data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}
