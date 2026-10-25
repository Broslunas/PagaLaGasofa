import type { Metadata } from "next"

import { DebtsList } from "@/components/dashboard/debts-list"
import { getDb } from "@/db"
import { requireUser } from "@/lib/auth/session"
import { getDebts } from "@/lib/dashboard/queries"
import { formatCents } from "@/lib/format"
import { siteOrigin } from "@/lib/site"

export const metadata: Metadata = { title: "Quién te debe", robots: { index: false } }

export default async function DebtsPage() {
  const user = await requireUser("/dashboard/deudas")
  const [debts, origin] = await Promise.all([getDebts(getDb(), user.id), siteOrigin()])
  const total = debts.reduce((s, d) => s + d.totalCents, 0)

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Quién te debe</h1>
        <p className="text-sm text-muted-foreground">
          {debts.length > 0 ? `En total te deben ${formatCents(total)}, sumando todos tus viajes.` : "Suma lo pendiente de todos tus viajes, por persona."}
        </p>
      </header>
      <DebtsList
        origin={origin}
        debtors={debts.map((d) => ({ ...d, trips: d.trips.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })) }))}
      />
    </div>
  )
}
