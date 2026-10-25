import { NextResponse, type NextRequest } from "next/server"

import { getUser } from "@/lib/auth/session"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { TripCalculationError } from "@/lib/trip/calculator"
import { createTrip } from "@/lib/trip/create"
import { tripDraftSchema } from "@/lib/trip/schema"

const MAX_BODY_BYTES = 1_000_000

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { name: "trips", limit: 10, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const length = Number(request.headers.get("content-length") ?? 0)
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Petición demasiado grande" }, { status: 413 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON no válido" }, { status: 400 })
  }

  const parsed = tripDraftSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos del viaje no válidos", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    )
  }

  try {
    const user = await getUser()
    const { shareId, manageToken, result } = await createTrip(parsed.data, user?.id ?? null)

    const response = NextResponse.json(
      { shareId, manageToken, totalCents: result.totalCents, amountsCents: result.amountsCents },
      { status: 201 },
    )
    // El dispositivo que crea el ticket queda como gestor sin necesidad de cuenta.
    response.cookies.set(`plg_manage_${shareId}`, manageToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  } catch (error) {
    if (error instanceof TripCalculationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("POST /api/trips", error)
    return NextResponse.json({ error: "No se pudo crear el viaje" }, { status: 500 })
  }
}
