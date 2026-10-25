import type { Metadata } from "next"

import { getProfile, requireUser } from "@/lib/auth/session"

export const metadata: Metadata = { title: "Mi cuenta" }

export default async function DashboardPage() {
  const user = await requireUser("/dashboard")
  const profile = await getProfile(user.id)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-2 px-4 py-10">
      <h1 className="text-3xl font-semibold">
        Hola, {profile?.displayName ?? user.email}
      </h1>
      <p className="text-muted-foreground">
        Aquí irán tus viajes, vehículos y favoritas (Fase 10).
      </p>
    </div>
  )
}
