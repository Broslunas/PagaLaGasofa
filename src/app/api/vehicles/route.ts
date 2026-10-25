import { NextResponse, type NextRequest } from "next/server"

import { getUser } from "@/lib/auth/session"
import { createVehicle, listVehicles } from "@/lib/vehicles/queries"
import { vehicleInputSchema } from "@/lib/vehicles/schema"

const unauthorized = () => NextResponse.json({ error: "Inicia sesión" }, { status: 401 })

export async function GET() {
  const user = await getUser()
  if (!user) return unauthorized()
  return NextResponse.json({ vehicles: await listVehicles(user.id) })
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return unauthorized()

  const parsed = vehicleInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })

  const count = (await listVehicles(user.id)).length
  if (count >= 20) return NextResponse.json({ error: "Máximo 20 vehículos" }, { status: 409 })

  return NextResponse.json({ vehicle: await createVehicle(user.id, parsed.data) }, { status: 201 })
}
