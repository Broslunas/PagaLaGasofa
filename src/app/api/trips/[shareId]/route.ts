import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getDb } from "@/db"
import { trips } from "@/db/schema"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { broadcastTripChanged } from "@/lib/realtime"
import { requireManagedTrip } from "@/lib/trip/ticket"

const patchSchema = z.object({ title: z.string().trim().max(80) })

export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/trips/[shareId]">) {
  const limit = await rateLimit(request, { name: "trip-edit", limit: 30, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })

  const { shareId } = await params
  const managed = await requireManagedTrip(shareId)
  if ("error" in managed) return managed.error

  await getDb().update(trips).set({ title: parsed.data.title || null }).where(eq(trips.id, managed.trip.id))
  await broadcastTripChanged(shareId)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: RouteContext<"/api/trips/[shareId]">) {
  const limit = await rateLimit(request, { name: "trip-delete", limit: 10, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const { shareId } = await params
  const managed = await requireManagedTrip(shareId)
  if ("error" in managed) return managed.error

  await getDb().delete(trips).where(eq(trips.id, managed.trip.id))
  await broadcastTripChanged(shareId)
  return new NextResponse(null, { status: 204 })
}
