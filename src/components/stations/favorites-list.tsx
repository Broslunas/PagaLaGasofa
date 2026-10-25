"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import type { StationDto, StationFuel } from "@/lib/stations/types"

import { AlertEditor } from "./alert-editor"
import { STATION_FUELS } from "@/lib/stations/types"
import { StationCard } from "./station-card"

type Favorite = { fuelType: StationFuel; alertEnabled: boolean; alertThreshold: number | null; station: StationDto }
type State = { status: "loading" } | { status: "anonymous" } | { status: "error" } | { status: "ready"; items: Favorite[] }

export function FavoritesList() {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/favorites", { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401) return setState({ status: "anonymous" })
        if (!res.ok) throw new Error()
        setState({ status: "ready", items: ((await res.json()) as { favorites: Favorite[] }).favorites })
      })
      .catch((e) => e.name !== "AbortError" && setState({ status: "error" }))
    return () => controller.abort()
  }, [])

  if (state.status === "loading") return <div className="h-32 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
  if (state.status === "error") return <p role="alert" className="text-destructive">No se pudieron cargar tus favoritas.</p>
  if (state.status === "anonymous") {
    return (
      <div className="space-y-3 rounded-2xl border bg-card p-6 text-center">
        <p className="text-muted-foreground">Inicia sesión para guardar tus gasolineras y ver su precio de un vistazo.</p>
        <Button asChild><Link href="/login?next=/gasolineras/favoritas">Iniciar sesión</Link></Button>
      </div>
    )
  }
  if (state.items.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed p-6 text-center">
        <p className="text-muted-foreground">Aún no tienes favoritas. Pulsa el corazón en cualquier gasolinera para guardarla.</p>
        <Button asChild variant="outline"><Link href="/gasolineras">Buscar gasolineras</Link></Button>
      </div>
    )
  }
  return (
    <ul className="space-y-2">
      {state.items.map(({ station, fuelType, alertEnabled, alertThreshold }) => (
        <StationCard
          key={station.id}
          station={station}
          fuel={fuelType}
          footer={
            <AlertEditor
              stationId={station.id}
              fuel={fuelType}
              currentPrice={station.prices[fuelType]}
              initialEnabled={alertEnabled}
              initialThreshold={alertThreshold}
              availableFuels={STATION_FUELS.filter((f) => station.prices[f] !== null)}
            />
          }
        />
      ))}
    </ul>
  )
}
