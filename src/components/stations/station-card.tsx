"use client"

import Link from "next/link"

import { formatDistance, formatPrice } from "@/lib/format"
import type { StationDto, StationFuel } from "@/lib/stations/types"
import { cn } from "@/lib/utils"

import { BrandAvatar } from "./brand-avatar"
import { FavoriteButton } from "./favorite-button"

export function StationCard({
  station,
  fuel,
  selected,
  best,
  onSelect,
  footer,
}: {
  station: StationDto
  fuel: StationFuel
  selected?: boolean
  best?: boolean
  onSelect?: () => void
  /** Contenido adicional bajo la tarjeta (p. ej. la configuración de alertas). */
  footer?: React.ReactNode
}) {
  const price = station.prices[fuel]
  return (
    <li
      id={`station-${station.id}`}
      aria-current={selected || undefined}
      className={cn("rounded-2xl border bg-card transition-colors", selected && "border-primary ring-2 ring-primary/30")}
    >
      <div className="flex items-start gap-3 p-3">
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-start gap-3 text-left" aria-label={`Ver ${station.name} en el mapa`}>
          <BrandAvatar brand={station.brand} name={station.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{station.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {station.address}
              {station.locality ? ` · ${station.locality}` : ""}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              {station.distanceKm !== undefined && <span className="text-muted-foreground">{formatDistance(station.distanceKm)}</span>}
              <span className={cn(station.open === true && "text-success", station.open === false && "text-destructive", station.open === null && "text-muted-foreground")}>
                {station.openLabel}
              </span>
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className={cn("block text-lg font-semibold tabular-nums", best && "text-success")}>{price === null ? "—" : formatPrice(price)}</span>
            <span className="block text-[11px] text-muted-foreground">€/l</span>
          </span>
        </button>
      </div>
      <div className="flex items-center justify-between border-t px-3 py-1.5">
        <Link href={`/gasolineras/${station.id}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Ver precios e histórico
        </Link>
        <FavoriteButton stationId={station.id} fuelType={fuel} loginNext="/gasolineras" compact />
      </div>
      {footer}
    </li>
  )
}
