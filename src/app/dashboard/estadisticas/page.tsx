import type { Metadata } from "next"

import { StatsView } from "@/components/dashboard/stats-view"
import { getDb } from "@/db"
import { requireUser } from "@/lib/auth/session"
import { monthlyStats } from "@/lib/dashboard/queries"
import { yearMonthInZone } from "@/lib/trip/stats"

export const metadata: Metadata = { title: "Estadísticas", robots: { index: false } }

export default async function StatsPage() {
  const user = await requireUser("/dashboard/estadisticas")
  const now = new Date()
  const months = await monthlyStats(getDb(), user.id, now, 12)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Estadísticas</h1>
      <StatsView months={months} year={yearMonthInZone(now).year} />
    </div>
  )
}
