import type { Metadata } from "next"
import Link from "next/link"

import { StatCard } from "@/components/dashboard/stat-card"
import { TripRow } from "@/components/dashboard/trip-row"
import { Button } from "@/components/ui/button"
import { getDb } from "@/db"
import { requireUser, getProfile } from "@/lib/auth/session"
import { getDebts, getSummary, listTrips } from "@/lib/dashboard/queries"
import { formatCents, formatNumber } from "@/lib/format"

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } }

export default async function DashboardPage() {
  const user = await requireUser("/dashboard")
  const db = getDb()
  const [profile, summary, recent, debts] = await Promise.all([
    getProfile(user.id),
    getSummary(db, user.id),
    listTrips(db, user.id, { limit: 5, offset: 0 }),
    getDebts(db, user.id),
  ])
  const firstName = (profile?.displayName ?? user.email ?? "").split(/[ @]/)[0]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Hola{firstName ? `, ${firstName}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Esto es lo que llevas con PagaLaGasofa.</p>
        </div>
        <Button asChild><Link href="/viaje">Nuevo viaje</Link></Button>
      </header>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Viajes" value={String(summary.trips)} hint={`${formatNumber(summary.km)} km en total`} />
        <StatCard label="Gastado en gasolina" value={formatCents(summary.spendCents)} />
        <StatCard
          label="Te deben"
          value={formatCents(summary.pendingCents)}
          hint={summary.pendingPeople ? `${summary.pendingPeople} ${summary.pendingPeople === 1 ? "persona" : "personas"}` : "Nadie te debe nada"}
          tone={summary.pendingCents > 0 ? "warning" : "default"}
        />
        <StatCard label="Ahorrado repostando bien" value={formatCents(summary.savingsCents)} hint={`${formatNumber(summary.co2Kg)} kg de CO₂ emitidos`} tone={summary.savingsCents > 0 ? "success" : "default"} />
      </section>

      {debts.length > 0 && (
        <section aria-labelledby="debts-h" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 id="debts-h" className="text-lg font-semibold">Pendiente de cobro</h2>
            <Link href="/dashboard/deudas" className="text-sm text-primary underline-offset-4 hover:underline">Ver todo</Link>
          </div>
          <ul className="divide-y rounded-2xl border bg-card">
            {debts.slice(0, 3).map((d) => (
              <li key={d.key} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium">{d.name}</span>
                <span className="font-semibold tabular-nums">{formatCents(d.totalCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="recent-h" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 id="recent-h" className="text-lg font-semibold">Últimos viajes</h2>
          {recent.items.length > 0 && <Link href="/dashboard/viajes" className="text-sm text-primary underline-offset-4 hover:underline">Ver todos</Link>}
        </div>
        {recent.items.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Aún no has creado ningún viaje con tu cuenta.</p>
            <Button asChild variant="outline"><Link href="/viaje">Calcular el primero</Link></Button>
          </div>
        ) : (
          <ul className="space-y-2">{recent.items.map((t) => <TripRow key={t.shareId} trip={t} />)}</ul>
        )}
      </section>
    </div>
  )
}
