"use client"

import { useEffect, useMemo, useState } from "react"

import { MapView, type MapMarker } from "@/components/map/map-view"
import { PlaceSearch } from "@/components/map/place-search"
import { fetchRoute, reverseGeocode, toLngLat } from "@/lib/routing/client"
import type { PlaceResult, RouteResult } from "@/lib/routing/types"

export function RouteDemo() {
  const [origin, setOrigin] = useState<PlaceResult | null>(null)
  const [destination, setDestination] = useState<PlaceResult | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!origin || !destination) return
    const controller = new AbortController()
    fetchRoute([origin, destination], controller.signal)
      .then((r) => {
        setRoute(r)
        setError(null)
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message))
    return () => controller.abort()
  }, [origin, destination])

  const markers = useMemo<MapMarker[]>(
    () => [
      ...(origin ? [{ id: "o", kind: "origin" as const, label: "A", lngLat: toLngLat(origin) }] : []),
      ...(destination ? [{ id: "d", kind: "destination" as const, label: "B", lngLat: toLngLat(destination) }] : []),
    ],
    [origin, destination],
  )

  // Clic en el mapa: rellena primero el origen y luego el destino.
  async function onMapClick([lng, lat]: [number, number]) {
    const place = await reverseGeocode({ lat, lng }).catch(() => null)
    if (!place) return
    if (!origin) setOrigin(place)
    else setDestination(place)
  }

  const visibleRoute = origin && destination ? route : null

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <div className="space-y-3">
        <PlaceSearch label="Origen" placeholder="Origen" value={origin} onChange={setOrigin} />
        <PlaceSearch label="Destino" placeholder="Destino" value={destination} onChange={setDestination} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {visibleRoute && (
          <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Distancia</dt>
              <dd className="text-lg font-semibold">{visibleRoute.distanceKm.toLocaleString("es-ES")} km</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Duración</dt>
              <dd className="text-lg font-semibold">{visibleRoute.durationMin} min</dd>
            </div>
            <div className="col-span-2 text-muted-foreground">
              {visibleRoute.geometry.length} puntos de geometría
            </div>
          </dl>
        )}
        <p className="text-sm text-muted-foreground">También puedes hacer clic en el mapa para fijar origen y destino.</p>
      </div>
      <div className="h-[28rem] overflow-hidden rounded-2xl border lg:h-[34rem]">
        <MapView markers={markers} route={visibleRoute?.geometry} onMapClick={onMapClick} />
      </div>
    </div>
  )
}
