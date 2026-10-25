import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { getDb } from "@/db"
import { trips } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { requireManagedTrip } from "@/lib/trip/ticket"

/** Vincula un ticket anónimo a la cuenta del usuario: deja de caducar y aparece en su panel. */
export async function POST(_request: NextRequest, { params }: RouteContext<"/api/trips/[shareId]/claim">) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })

  const managed = await requireManagedTrip((await params).shareId)
  if ("error" in managed) return managed.error
  if (managed.trip.userId && managed.trip.userId !== user.id) {
    return NextResponse.json({ error: "Este ticket ya pertenece a otra cuenta" }, { status: 409 })
  }

  await getDb().update(trips).set({ userId: user.id, expiresAt: null }).where(eq(trips.id, managed.trip.id))
  return NextResponse.json({ ok: true })
}
