"use client"

import { ArrowDown, ArrowUp, Loader2, LocateFixed, Plus, X } from "lucide-react"
import { useState, type Dispatch } from "react"

import { PlaceSearch } from "@/components/map/place-search"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { formatDuration, formatNumber } from "@/lib/format"
import { reverseGeocode } from "@/lib/routing/client"
import { LIMITS } from "@/lib/trip/schema"

import type { Action, PlannerState } from "./state"

export function StepRoute({ state, dispatch }: { state: PlannerState; dispatch: Dispatch<Action> }) {
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  function useMyLocation() {
    if (!("geolocation" in navigator)) return setLocateError("Tu navegador no permite obtener la ubicación")
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          dispatch({ type: "origin", place: await reverseGeocode({ lat: coords.latitude, lng: coords.longitude }) })
        } catch {
          setLocateError("No se pudo identificar tu ubicación")
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setLocateError("No tenemos permiso para ver tu ubicación")
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  const { route } = state
  const legs = state.waypoints.length + 1

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PlaceSearch
            className="flex-1"
            label="Origen"
            placeholder="¿Desde dónde sales?"
            value={state.origin}
            onChange={(place) => dispatch({ type: "origin", place })}
          />
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={useMyLocation}
            disabled={locating}
            aria-label="Usar mi ubicación como origen"
            title="Usar mi ubicación"
          >
            {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          </Button>
        </div>
        {locateError && <p role="alert" className="text-xs text-destructive">{locateError}</p>}

        {state.waypoints.map((waypoint, i) => (
          <div key={i} className="flex items-center gap-1">
            <PlaceSearch
              className="flex-1"
              label={`Parada ${i + 1}`}
              placeholder={`Parada ${i + 1}`}
              value={waypoint}
              onChange={(place) => dispatch({ type: "waypoint-set", index: i, place })}
            />
            <div className="flex">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Subir parada" disabled={i === 0}
                onClick={() => dispatch({ type: "waypoint-move", index: i, by: -1 })}><ArrowUp /></Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Bajar parada" disabled={i === state.waypoints.length - 1}
                onClick={() => dispatch({ type: "waypoint-move", index: i, by: 1 })}><ArrowDown /></Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar parada"
                onClick={() => dispatch({ type: "waypoint-remove", index: i })}><X /></Button>
            </div>
          </div>
        ))}

        <PlaceSearch
          label="Destino"
          placeholder="¿A dónde vas?"
          value={state.destination}
          onChange={(place) => dispatch({ type: "destination", place })}
        />

        {state.waypoints.length < LIMITS.stops.max - 2 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => dispatch({ type: "waypoint-add" })}>
            <Plus /> Añadir parada intermedia
          </Button>
        )}
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <span>
          <span className="block text-sm font-medium">Ida y vuelta</span>
          <span className="block text-xs text-muted-foreground">Cuenta el trayecto dos veces</span>
        </span>
        <Switch checked={state.isRoundTrip} onCheckedChange={(value) => dispatch({ type: "round-trip", value })} />
      </label>

      <div aria-live="polite" className="min-h-16">
        {state.routeStatus === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Calculando la ruta…
          </p>
        )}
        {state.routeStatus === "error" && <p role="alert" className="text-sm text-destructive">{state.routeError}</p>}
        {route && state.routeStatus !== "loading" && (
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-primary-soft p-3">
            <div>
              <dt className="text-xs text-muted-foreground">Distancia{state.isRoundTrip ? " (ida)" : ""}</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatNumber(route.distanceKm)} km</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Duración{state.isRoundTrip ? " (ida)" : ""}</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatDuration(route.durationMin)}</dd>
            </div>
            {legs > 1 && (
              <div className="col-span-2 text-xs text-muted-foreground">
                Tramos: {route.legsKm.map((km) => `${formatNumber(km)} km`).join(" · ")}
              </div>
            )}
          </dl>
        )}
        {!route && state.routeStatus === "idle" && (
          <p className="text-sm text-muted-foreground">
            Busca origen y destino, o toca el mapa para fijarlos.
          </p>
        )}
      </div>
    </div>
  )
}
