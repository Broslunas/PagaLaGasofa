import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { getDb } from "@/db"
import { liveShares } from "@/db/schema"
import { liveState, positionSchema } from "@/lib/live/logic"
import { canManageLive, loadLive } from "@/lib/live/server"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { broadcastLiveChanged } from "@/lib/realtime"

/** Recibe la posición del conductor, la guarda (solo la última) y avisa a quienes miran. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/live/[shareId]/position">) {
  const limit = await rateLimit(request, { name: "live-position", limit: 30, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const parsed = positionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Posición no válida" }, { status: 400 })

  const live = await loadLive((await params).shareId)
  if (!live) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
  if (liveState(live) !== "active") return NextResponse.json({ error: "La sesión ha terminado" }, { status: 410 })
  if (!(await canManageLive(live))) return NextResponse.json({ error: "No tienes permiso" }, { status: 403 })

  const p = parsed.data
  await getDb()
    .update(liveShares)
    .set({
      lat: p.lat,
      lng: p.lng,
      accuracyM: p.accuracy ?? null,
      headingDeg: p.heading ?? null,
      speedMs: p.speed ?? null,
      positionAt: new Date(),
    })
    .where(eq(liveShares.id, live.id))
  await broadcastLiveChanged(live.shareId)
  return NextResponse.json({ ok: true })
}
