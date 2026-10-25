import "server-only"

import { eq, inArray } from "drizzle-orm"
import { authUsers } from "drizzle-orm/supabase"

import { getDb } from "@/db"
import { notifications, profiles, pushSubscriptions } from "@/db/schema"

import { priceAlertEmail, sendEmail } from "./email"
import type { Message } from "./messages"
import { sendPush } from "./push"

export interface DispatchResult {
  push: number
  email: boolean
}

/**
 * Entrega una notificación por todos los canales activos del usuario:
 * centro de notificaciones (siempre), Web Push (cada dispositivo suscrito) y email (si lo activó).
 */
export async function notifyUser(userId: string, message: Message, type: "price_drop" | "system" = "price_drop"): Promise<DispatchResult> {
  const db = getDb()
  await db.insert(notifications).values({ userId, type, title: message.title, body: message.body, url: message.url })

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  const results = await Promise.all(subs.map((s) => sendPush(s, message)))
  const gone = subs.filter((_, i) => results[i] === "gone").map((s) => s.id)
  if (gone.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone))

  let email = false
  const [profile] = await db.select({ notifyEmail: profiles.notifyEmail }).from(profiles).where(eq(profiles.id, userId)).limit(1)
  if (profile?.notifyEmail) {
    const [user] = await db.select({ email: authUsers.email }).from(authUsers).where(eq(authUsers.id, userId)).limit(1)
    if (user?.email) email = await sendEmail(priceAlertEmail({ to: user.email, title: message.title, body: message.body, url: message.url }))
  }

  return { push: results.filter((r) => r === "sent").length, email }
}
