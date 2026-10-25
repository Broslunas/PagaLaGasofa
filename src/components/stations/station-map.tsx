"use client"

import { useMemo } from "react"

import { MapView, type MapMarker } from "@/components/map/map-view"

export function StationMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const markers = useMemo<MapMarker[]>(() => [{ id: "s", kind: "station", lngLat: [lng, lat], label, selected: true }], [lat, lng, label])
  return <MapView markers={markers} />
}
