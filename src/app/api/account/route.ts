import { eq, sql } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { getDb } from "@/db"
import { trips } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

const bodySchema = z.object({
  confirm: z.literal("ELIMINAR"),
  /** `true`: se borran también los tickets. `false`: quedan visibles con su enlace y caducan al año. */
  deleteTrips: z.boolean(),
})

/**
 * Elimina la cuenta y todos sus datos personales (derecho de supresión).
 * Los tickets compartidos con otras personas pueden conservarse sin vínculo con la cuenta.
 */
export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })
  const limit = await rateLimit(request, { name: "account-delete", limit: 3, windowSec: 3600 })
  if (!limit.ok) return tooManyRequests(limit)

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Escribe ELIMINAR para confirmar" }, { status: 400 })

  const db = getDb()
  await db.transaction(async (tx) => {
    if (parsed.data.deleteTrips) {
      await tx.delete(trips).where(eq(trips.userId, user.id))
    } else {
      // Dejan de depender de la cuenta, así que ahora caducan como cualquier ticket anónimo.
      await tx.update(trips).set({ expiresAt: sql`now() + interval '1 year'` }).where(eq(trips.userId, user.id))
    }
    // El resto (perfil, vehículos, favoritas, notificaciones, dispositivos) se borra en cascada con el usuario.
    await tx.execute(sql`delete from auth.users where id = ${user.id}`)
  })

  const supabase = await createClient()
  await supabase.auth.signOut().catch(() => {})
  return NextResponse.json({ ok: true })
}
