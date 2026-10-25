"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import type { Map as MapLibreMap, Marker } from "maplibre-gl"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"

import { loadMapStyle } from "@/lib/map/style"
import type { LngLat } from "@/lib/routing/types"
import { cn } from "@/lib/utils"

export interface MapMarker {
  id: string
  lngLat: LngLat
  kind: "origin" | "stop" | "destination"
  /** Texto dentro del marcador (A, B, 1, 2…). */
  label?: string
}

interface Props {
  markers?: MapMarker[]
  route?: LngLat[] | null
  onMapClick?: (lngLat: LngLat) => void
  className?: string
  /** Espacio reservado al ajustar la vista, p. ej. para una hoja inferior. */
  padding?: { top: number; right: number; bottom: number; left: number }
}

const SPAIN_CENTER: LngLat = [-3.7, 40.2]
const ROUTE_SOURCE = "plg-route"

const kindClass: Record<MapMarker["kind"], string> = {
  origin: "bg-primary text-primary-foreground",
  stop: "bg-card text-foreground border border-border",
  destination: "bg-fuel text-fuel-foreground",
}

function markerElement(marker: MapMarker) {
  const el = document.createElement("div")
  el.className = cn(
    "flex size-8 items-center justify-center rounded-full text-sm font-semibold shadow-md ring-2 ring-background",
    kindClass[marker.kind],
  )
  el.textContent = marker.label ?? ""
  return el
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function MapView({ markers = [], route = null, onMapClick, className, padding }: Props) {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === "dark" ? "dark" : "light"

  const [failed, setFailed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerObjs = useRef<Marker[]>([])
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null)

  // Los últimos valores, accesibles desde los callbacks del mapa sin recrearlo.
  const latest = useRef<{
    route: Props["route"]
    markers: MapMarker[]
    onMapClick: Props["onMapClick"]
    padding: Props["padding"]
    theme: "light" | "dark"
  }>({ route, markers, onMapClick, padding, theme })
  // Debe ir antes que el resto de efectos: estos leen `latest` al ejecutarse.
  useEffect(() => {
    latest.current = { route, markers, onMapClick, padding, theme }
  })

  function drawRoute(map: MapLibreMap) {
    const coords = latest.current.route
    const data = {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: coords ?? [] },
    }
    const source = map.getSource(ROUTE_SOURCE)
    if (source && "setData" in source) {
      ;(source as { setData: (d: typeof data) => void }).setData(data)
      return
    }
    if (!map.isStyleLoaded()) return
    map.addSource(ROUTE_SOURCE, { type: "geojson", data })
    map.addLayer({
      id: `${ROUTE_SOURCE}-casing`,
      type: "line",
      source: ROUTE_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": latest.current.theme === "dark" ? "#0b0f10" : "#ffffff", "line-width": 9 },
    })
    map.addLayer({
      id: `${ROUTE_SOURCE}-line`,
      type: "line",
      source: ROUTE_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": latest.current.theme === "dark" ? "#4fd1a5" : "#14886a", "line-width": 5 },
    })
  }

  function fit(map: MapLibreMap) {
    const { route, markers, padding } = latest.current
    const points: LngLat[] = route && route.length > 1 ? route : markers.map((m) => m.lngLat)
    if (points.length === 0) return
    const duration = prefersReducedMotion() ? 0 : 700
    if (points.length === 1) {
      map.easeTo({ center: points[0], zoom: Math.max(map.getZoom(), 13), duration })
      return
    }
    const lngs = points.map((p) => p[0])
    const lats = points.map((p) => p[1])
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: padding ?? { top: 60, right: 60, bottom: 60, left: 60 }, duration, maxZoom: 15 },
    )
  }

  // Creación del mapa (una sola vez).
  useEffect(() => {
    let disposed = false
    let map: MapLibreMap | null = null

    ;(async () => {
      try {
        // MapLibre inicializa WebGL de forma asíncrona y el error no se puede capturar después.
        if (!document.createElement("canvas").getContext("webgl2")) throw new Error("WebGL2 no disponible")
        const [maplibre, style] = await Promise.all([import("maplibre-gl"), loadMapStyle(latest.current.theme)])
        if (disposed || !containerRef.current) return
        maplibreRef.current = maplibre

        map = new maplibre.Map({
          container: containerRef.current,
          style: style as never,
          center: SPAIN_CENTER,
          zoom: 5,
          attributionControl: { compact: true },
          cooperativeGestures: false,
        })
      } catch {
        // Sin WebGL2 o sin red para el estilo: se muestra un aviso en lugar de un mapa roto.
        if (!disposed) setFailed(true)
        return
      }
      const maplibre = maplibreRef.current
      if (!map || !maplibre) return
      mapRef.current = map
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right")
      map.on("click", (e) => latest.current.onMapClick?.([e.lngLat.lng, e.lngLat.lat]))
      map.on("style.load", () => map && drawRoute(map))
      map.on("load", () => map && (drawRoute(map), fit(map)))
    })()

    return () => {
      disposed = true
      markerObjs.current.forEach((m) => m.remove())
      markerObjs.current = []
      map?.remove()
      mapRef.current = null
    }
  }, [])

  // Cambio de tema: se recarga el estilo; la ruta se redibuja en `style.load`.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    loadMapStyle(theme).then((style) => {
      if (!cancelled) map.setStyle(style as never)
    })
    return () => {
      cancelled = true
    }
  }, [theme])

  // Ruta.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    drawRoute(map)
    if (route && route.length > 1) fit(map)
  }, [route])

  // Marcadores.
  useEffect(() => {
    const map = mapRef.current
    const maplibre = maplibreRef.current
    if (!map || !maplibre) return
    markerObjs.current.forEach((m) => m.remove())
    markerObjs.current = markers.map((marker) =>
      new maplibre.Marker({ element: markerElement(marker) }).setLngLat(marker.lngLat).addTo(map),
    )
    if (!(route && route.length > 1)) fit(map)
  }, [markers, route])

  return (
    <div className={cn("relative size-full bg-muted", className)}>
      <div ref={containerRef} className="size-full" />
      {failed && (
        <p
          role="alert"
          className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground"
        >
          No se ha podido cargar el mapa. Comprueba tu conexión o que tu navegador admita WebGL.
        </p>
      )}
    </div>
  )
}
