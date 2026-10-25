import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getDb } from "@/db"
import { profiles } from "@/db/schema"
import { getUser } from "@/lib/auth/session"

const patchSchema = z.object({ notifyEmail: z.boolean().optional(), displayName: z.string().trim().min(1).max(60).optional() }).refine((v) => Object.keys(v).length > 0)

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })
  const [profile] = await getDb().select({ notifyEmail: profiles.notifyEmail, displayName: profiles.displayName }).from(profiles).where(eq(profiles.id, user.id)).limit(1)
  return NextResponse.json({ notifyEmail: profile?.notifyEmail ?? false, displayName: profile?.displayName ?? null, email: user.email ?? null })
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })
  await getDb().update(profiles).set(parsed.data).where(eq(profiles.id, user.id))
  return NextResponse.json({ ok: true })
}
