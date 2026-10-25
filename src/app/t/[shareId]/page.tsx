import { and, asc, eq, gt, isNull, or } from "drizzle-orm"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getDb } from "@/db"
import { tripPassengers, trips } from "@/db/schema"
import { formatCents, formatNumber } from "@/lib/format"
import { SHARE_ID_PATTERN } from "@/lib/tokens"

export const metadata: Metadata = { title: "Ticket de viaje", robots: { index: false } }

async function loadTrip(shareId: string) {
  if (!SHARE_ID_PATTERN.test(shareId)) return null
  const db = getDb()
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.shareId, shareId), or(isNull(trips.expiresAt), gt(trips.expiresAt, new Date()))))
    .limit(1)
  if (!trip) return null
  const passengers = await db
    .select()
    .from(tripPassengers)
    .where(eq(tripPassengers.tripId, trip.id))
    .orderBy(asc(tripPassengers.position))
  return { trip, passengers }
}

async function TicketBody({ params }: { params: Promise<{ shareId: string }> }) {
  const data = await loadTrip((await params).shareId)
  if (!data) notFound()
  const { trip, passengers } = data
  const first = trip.stops[0]?.label.split(",")[0]
  const last = trip.stops.at(-1)?.label.split(",")[0]

  // Vista provisional: la Fase 6 añade mapa, pagos en tiempo real, PDF, imagen y QR.
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">{trip.title || `${first} → ${last}`}</h1>
      <p className="text-muted-foreground">
        {formatNumber(trip.distanceKm)} km · {formatCents(trip.totalCents)} en total
      </p>
      <ul className="divide-y rounded-xl border bg-card">
        {passengers.map((p) => (
          <li key={p.id} className="flex justify-between px-3 py-2.5">
            <span>{p.name}</span>
            <span className="font-semibold tabular-nums">{formatCents(p.amountCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function TicketPage({ params }: PageProps<"/t/[shareId]">) {
  return (
    <Suspense fallback={<div className="flex-1" aria-busy />}>
      <TicketBody params={params} />
    </Suspense>
  )
}
