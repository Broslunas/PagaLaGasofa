"use client"

import { useMemo } from "react"

import { MapView, type MapMarker } from "@/components/map/map-view"
import type { LngLat } from "@/lib/routing/types"

interface Props {
  stops: { lat: number; lng: number }[]
  geometry: LngLat[]
}

export function TicketMap({ stops, geometry }: Props) {
  const markers = useMemo<MapMarker[]>(
    () =>
      stops.map((s, i) => ({
        id: `s${i}`,
        kind: i === 0 ? "origin" : i === stops.length - 1 ? "destination" : "stop",
        label: i === 0 ? "A" : i === stops.length - 1 ? "B" : String(i),
        lngLat: [s.lng, s.lat],
      })),
    [stops],
  )
  return <MapView markers={markers} route={geometry} />
}
