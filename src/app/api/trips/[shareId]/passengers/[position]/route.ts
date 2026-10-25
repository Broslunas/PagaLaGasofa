import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { broadcastTripChanged } from "@/lib/realtime"
import { requireManagedTrip, setPassengerPaid } from "@/lib/trip/ticket"

const bodySchema = z.object({ hasPaid: z.boolean() })

export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/trips/[shareId]/passengers/[position]">) {
  const limit = await rateLimit(request, { name: "trip-paid", limit: 60, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const { shareId, position: rawPosition } = await params
  const position = Number(rawPosition)
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !Number.isInteger(position) || position < 1) {
    return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })
  }

  const managed = await requireManagedTrip(shareId)
  if ("error" in managed) return managed.error

  const row = await setPassengerPaid(managed.trip.id, position, parsed.data.hasPaid)
  if (!row) return NextResponse.json({ error: "Pasajero no encontrado" }, { status: 404 })

  await broadcastTripChanged(shareId)
  return NextResponse.json({ passenger: { position: row.position, hasPaid: row.hasPaid } })
}
