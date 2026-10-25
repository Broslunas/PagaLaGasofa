import type { Metadata } from "next"
import Link from "next/link"

import { TripRow } from "@/components/dashboard/trip-row"
import { Button } from "@/components/ui/button"
import { getDb } from "@/db"
import { requireUser } from "@/lib/auth/session"
import { listTrips } from "@/lib/dashboard/queries"

export const metadata: Metadata = { title: "Mis viajes", robots: { index: false } }
const PAGE_SIZE = 15

export default async function TripsPage({ searchParams }: PageProps<"/dashboard/viajes">) {
  const user = await requireUser("/dashboard/viajes")
  const sp = await searchParams
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : ""
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1)
  const { items, hasMore } = await listTrips(getDb(), user.id, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, q: q || undefined })

  const href = (p: number) => `/dashboard/viajes?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis viajes</h1>
        <form role="search" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Buscar por título o lugar" aria-label="Buscar viajes" maxLength={60}
            className="h-10 w-56 rounded-xl border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40" />
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          {q ? `Ningún viaje coincide con «${q}».` : "Todavía no tienes viajes."}
        </p>
      ) : (
        <ul className="space-y-2">{items.map((t) => <TripRow key={t.shareId} trip={t} />)}</ul>
      )}

      {(page > 1 || hasMore) && (
        <nav aria-label="Paginación" className="flex items-center justify-between">
          {page > 1 ? <Button asChild variant="outline"><Link href={href(page - 1)}>← Más recientes</Link></Button> : <span />}
          <span className="text-sm text-muted-foreground">Página {page}</span>
          {hasMore ? <Button asChild variant="outline"><Link href={href(page + 1)}>Anteriores →</Link></Button> : <span />}
        </nav>
      )}
    </div>
  )
}
