import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"

import { BrandAvatar } from "@/components/stations/brand-avatar"
import { FavoriteButton } from "@/components/stations/favorite-button"
import { PriceChart } from "@/components/stations/price-chart"
import { StationMap } from "@/components/stations/station-map"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { getStation } from "@/lib/stations/queries"
import { STATION_FUELS, type StationFuel } from "@/lib/stations/types"
import { FUEL_INFO } from "@/lib/trip/fuel"
import { cn } from "@/lib/utils"

const loadStation = cache(async (id: string) => (/^\d{1,8}$/.test(id) ? getStation(id) : null))

export async function generateMetadata({ params }: PageProps<"/gasolineras/[id]">): Promise<Metadata> {
  const station = await loadStation((await params).id)
  if (!station) return { title: "Gasolinera" }
  return {
    title: `${station.name} · ${station.locality || station.province}`,
    description: `Precios y horario de ${station.name} en ${station.address}, ${station.locality}.`,
  }
}

async function StationBody({ params }: { params: Promise<{ id: string }> }) {
  const station = await loadStation((await params).id)
  if (!station) notFound()

  const fuels = STATION_FUELS.filter((f) => station.prices[f] !== null)
  const cheapestFirst = fuels[0] as StationFuel | undefined
  const where = [station.address, station.locality, station.province].filter(Boolean).join(", ")
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}&travelmode=driving`

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <Link href="/gasolineras" className="text-sm text-muted-foreground underline-offset-4 hover:underline">← Todas las gasolineras</Link>

      <header className="flex items-start gap-4">
        <BrandAvatar brand={station.brand} name={station.name} className="size-14 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-balance text-2xl font-semibold sm:text-3xl">{station.name}</h1>
          <p className="text-sm text-muted-foreground">{where}</p>
          <p className={cn("mt-1 text-sm font-medium", station.open === true && "text-success", station.open === false && "text-destructive", station.open === null && "text-muted-foreground")}>
            {station.openLabel}
          </p>
        </div>
        <FavoriteButton stationId={station.id} fuelType={cheapestFirst} loginNext={`/gasolineras/${station.id}`} />
      </header>

      <section aria-labelledby="prices-h" className="space-y-3">
        <h2 id="prices-h" className="text-lg font-semibold">Precios hoy</h2>
        {fuels.length === 0 ? (
          <p className="text-muted-foreground">Esta gasolinera no tiene precios publicados.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fuels.map((f) => (
              <li key={f} className="rounded-2xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">{FUEL_INFO[f].label}</p>
                <p className="text-2xl font-semibold tabular-nums">{formatPrice(station.prices[f] as number)} <span className="text-sm font-normal text-muted-foreground">€/l</span></p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="h-64 overflow-hidden rounded-2xl border">
            <StationMap lat={station.lat} lng={station.lng} label={station.name.slice(0, 14)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild><a href={directions} target="_blank" rel="noopener noreferrer">Cómo llegar</a></Button>
            <Button asChild variant="outline"><Link href="/viaje">Calcular un viaje</Link></Button>
          </div>
        </div>
        <section aria-labelledby="hours-h" className="space-y-2 rounded-2xl border bg-card p-4">
          <h2 id="hours-h" className="text-lg font-semibold">Horario</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {station.schedule ? station.schedule.split(";").map((s) => s.trim()).join("\n") : "Horario no disponible"}
          </p>
          <p className="pt-2 text-xs text-muted-foreground">Datos del Ministerio para la Transición Ecológica, actualizados cada hora.</p>
        </section>
      </div>

      {cheapestFirst && <PriceChart stationId={station.id} fuels={fuels} initialFuel={cheapestFirst} />}
    </div>
  )
}

export default function StationPage({ params }: PageProps<"/gasolineras/[id]">) {
  return (
    <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
      <StationBody params={params} />
    </Suspense>
  )
}
