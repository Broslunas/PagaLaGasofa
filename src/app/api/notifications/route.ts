import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getDb } from "@/db"
import { notifications } from "@/db/schema"
import { getUser } from "@/lib/auth/session"

const unauthorized = () => NextResponse.json({ error: "Inicia sesión" }, { status: 401 })

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return unauthorized()
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 20))
  const db = getDb()
  const [items, [{ unread }]] = await Promise.all([
    db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(limit),
    db.select({ unread: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
  ])
  return NextResponse.json({ notifications: items, unread }, { headers: { "Cache-Control": "private, no-store" } })
}

const patchSchema = z.union([z.object({ all: z.literal(true) }), z.object({ ids: z.array(z.uuid()).min(1).max(100) })])

/** Marca como leídas todas o las indicadas. */
export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return unauthorized()
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })

  const own = and(eq(notifications.userId, user.id), isNull(notifications.readAt))
  await getDb()
    .update(notifications)
    .set({ readAt: new Date() })
    .where("all" in parsed.data ? own : and(own, inArray(notifications.id, parsed.data.ids)))
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const user = await getUser()
  if (!user) return unauthorized()
  await getDb().delete(notifications).where(eq(notifications.userId, user.id))
  return new NextResponse(null, { status: 204 })
}
