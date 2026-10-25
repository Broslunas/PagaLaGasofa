import "server-only"

import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { cache } from "react"

import { getDb } from "@/db"
import { profiles } from "@/db/schema"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

/** Usuario autenticado (verificado contra Supabase) o `null`. */
export const getUser = cache(async () => {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
})

/** Para páginas y acciones protegidas: redirige al login si no hay sesión. */
export async function requireUser(next?: string) {
  const user = await getUser()
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`)
  return user
}

export const getProfile = cache(async (userId: string) => {
  const [profile] = await getDb().select().from(profiles).where(eq(profiles.id, userId)).limit(1)
  return profile ?? null
})
