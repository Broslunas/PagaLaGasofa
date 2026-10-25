import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getDb } from "@/db"
import { liveShares } from "@/db/schema"
import { expiryFrom, liveState, MAX_DURATION_H } from "@/lib/live/logic"
import { canManageLive, loadLive, toLiveDto } from "@/lib/live/server"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { broadcastLiveChanged } from "@/lib/realtime"

const NO_STORE = { "Cache-Control": "no-store" }

/** Estado público de la sesión: lo que ve cualquiera con el enlace. */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/live/[shareId]">) {
  const limit = await rateLimit(request, { name: "live-read", limit: 180, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const live = await loadLive((await params).shareId)
  if (!live) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404, headers: NO_STORE })
  return NextResponse.json(await toLiveDto(live), { headers: NO_STORE })
}

const extendSchema = z.object({ hours: z.number().int().min(1).max(MAX_DURATION_H) })

/** Alarga la sesión: caduca dentro de `hours` horas a partir de ahora. */
export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/live/[shareId]">) {
  const parsed = extendSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })
  const live = await loadLive((await params).shareId)
  if (!live || liveState(live) !== "active") return NextResponse.json({ error: "Sesión no activa" }, { status: 404 })
  if (!(await canManageLive(live))) return NextResponse.json({ error: "No tienes permiso" }, { status: 403 })

  await getDb().update(liveShares).set({ expiresAt: expiryFrom(parsed.data.hours) }).where(eq(liveShares.id, live.id))
  await broadcastLiveChanged(live.shareId)
  return NextResponse.json({ ok: true })
}

/** Para la sesión y borra la última posición guardada. */
export async function DELETE(_request: NextRequest, { params }: RouteContext<"/api/live/[shareId]">) {
  const live = await loadLive((await params).shareId)
  if (!live) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
  if (!(await canManageLive(live))) return NextResponse.json({ error: "No tienes permiso" }, { status: 403 })

  await getDb()
    .update(liveShares)
    .set({ stoppedAt: new Date(), lat: null, lng: null, accuracyM: null, headingDeg: null, speedMs: null, positionAt: null })
    .where(eq(liveShares.id, live.id))
  await broadcastLiveChanged(live.shareId)
  return new NextResponse(null, { status: 204 })
}
