import { NextResponse, type NextRequest } from "next/server"

import { getUser } from "@/lib/auth/session"
import { notifyUser } from "@/lib/notify/dispatch"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"

/** Envía una notificación de prueba al propio usuario por todos sus canales. */
export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })
  const limit = await rateLimit(request, { name: `notify-test`, limit: 5, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const result = await notifyUser(
    user.id,
    { title: "Notificación de prueba", body: "Así verás las alertas de precio de tus gasolineras favoritas.", url: "/gasolineras/favoritas" },
    "system",
  )
  return NextResponse.json(result)
}
