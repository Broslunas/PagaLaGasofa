import Link from "next/link"

import { formatCents, formatNumber } from "@/lib/format"
import type { TripListItem } from "@/lib/dashboard/queries"

const date = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" })

export function TripRow({ trip }: { trip: TripListItem }) {
  return (
    <li>
      <Link href={`/t/${trip.shareId}`} className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{trip.title || `${trip.from} → ${trip.to}`}</p>
          <p className="truncate text-xs text-muted-foreground">
            {date.format(trip.createdAt)} · {formatNumber(trip.distanceKm)} km · {trip.passengers} {trip.passengers === 1 ? "persona" : "personas"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold tabular-nums">{formatCents(trip.totalCents)}</p>
          {trip.pendingCount > 0 ? (
            <p className="text-xs text-destructive">Faltan {formatCents(trip.pendingCents)}</p>
          ) : trip.passengers > 1 ? (
            <p className="text-xs text-success">Todo cobrado</p>
          ) : null}
        </div>
      </Link>
    </li>
  )
}
