import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getDb } from "@/db"
import { getUser } from "@/lib/auth/session"
import { settleDebts } from "@/lib/dashboard/queries"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { broadcastTripChanged } from "@/lib/realtime"

const bodySchema = z.object({ key: z.string().trim().min(1).max(80) })

/** Marca como pagado todo lo pendiente de una persona en los viajes del usuario. */
export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })
  const limit = await rateLimit(request, { name: "debts-settle", limit: 20, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })

  const shareIds = await settleDebts(getDb(), user.id, parsed.data.key.toLocaleLowerCase("es"))
  // Las pantallas abiertas de esos tickets se actualizan al momento.
  await Promise.all(shareIds.slice(0, 25).map((id) => broadcastTripChanged(id)))
  return NextResponse.json({ tickets: shareIds.length })
}
