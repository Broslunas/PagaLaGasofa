import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getUser } from "@/lib/auth/session"
import { deleteVehicle, updateVehicle } from "@/lib/vehicles/queries"
import { vehicleInputSchema } from "@/lib/vehicles/schema"

const idSchema = z.uuid()
const unauthorized = () => NextResponse.json({ error: "Inicia sesión" }, { status: 401 })
const notFound = () => NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })

export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/vehicles/[id]">) {
  const user = await getUser()
  if (!user) return unauthorized()
  const id = idSchema.safeParse((await params).id)
  if (!id.success) return notFound()

  const parsed = vehicleInputSchema.partial().safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })

  const vehicle = await updateVehicle(user.id, id.data, parsed.data)
  return vehicle ? NextResponse.json({ vehicle }) : notFound()
}

export async function DELETE(_request: NextRequest, { params }: RouteContext<"/api/vehicles/[id]">) {
  const user = await getUser()
  if (!user) return unauthorized()
  const id = idSchema.safeParse((await params).id)
  if (!id.success) return notFound()
  return (await deleteVehicle(user.id, id.data)) ? new NextResponse(null, { status: 204 }) : notFound()
}
