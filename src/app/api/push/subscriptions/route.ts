import { and, eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getDb } from "@/db"
import { pushSubscriptions } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"

const MAX_DEVICES = 10
const unauthorized = () => NextResponse.json({ error: "Inicia sesión" }, { status: 401 })

const subscribeSchema = z.object({
  endpoint: z.url().max(1000).refine((u) => u.startsWith("https://"), "Solo https"),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
})

/** Dispositivos del usuario. Nunca se devuelven las claves de la suscripción. */
export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return unauthorized()
  const rows = await getDb()
    .select({ id: pushSubscriptions.id, endpoint: pushSubscriptions.endpoint, userAgent: pushSubscriptions.userAgent, createdAt: pushSubscriptions.createdAt })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, user.id))
  // El cliente compara su propio endpoint para marcar «este dispositivo»; no se envía el endpoint completo de los demás.
  const current = request.nextUrl.searchParams.get("endpoint")
  return NextResponse.json({
    devices: rows.map((r) => ({ id: r.id, userAgent: r.userAgent, createdAt: r.createdAt, current: current === r.endpoint })),
  })
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { name: "push-subscribe", limit: 20, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)
  const user = await getUser()
  if (!user) return unauthorized()

  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Suscripción no válida" }, { status: 400 })

  const db = getDb()
  const mine = await db.select({ endpoint: pushSubscriptions.endpoint }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id))
  if (mine.length >= MAX_DEVICES && !mine.some((m) => m.endpoint === parsed.data.endpoint)) {
    return NextResponse.json({ error: `Máximo ${MAX_DEVICES} dispositivos` }, { status: 409 })
  }

  // Un mismo navegador puede pasar de una cuenta a otra: la suscripción se reasigna al usuario actual.
  await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
    })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) return unauthorized()
  const params = request.nextUrl.searchParams
  const id = z.uuid().safeParse(params.get("id"))
  const endpoint = params.get("endpoint")
  if (!id.success && !endpoint) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })

  await getDb()
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, user.id), id.success ? eq(pushSubscriptions.id, id.data) : eq(pushSubscriptions.endpoint, endpoint!)))
  return new NextResponse(null, { status: 204 })
}
