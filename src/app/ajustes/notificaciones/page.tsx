import type { Metadata } from "next"
import { Suspense } from "react"

import { NotificationSettings } from "@/components/notifications/notification-settings"
import { requireUser } from "@/lib/auth/session"

export const metadata: Metadata = { title: "Notificaciones", robots: { index: false } }

async function Guard() {
  await requireUser("/ajustes/notificaciones")
  return <NotificationSettings />
}

export default function NotificationSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Notificaciones</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-muted" aria-busy="true" />}>
        <Guard />
      </Suspense>
    </div>
  )
}
