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
  kind: "origin" | "stop" | "destination" | "station" | "center" | "live"
  /** Texto dentro del marcador (A, B, 1, 2…) o precio en las gasolineras. */
  label?: string
  /** Gasolinera más barata del conjunto. */
  best?: boolean
  selected?: boolean
}

interface Props {
  markers?: MapMarker[]
  route?: LngLat[] | null
  onMapClick?: (lngLat: LngLat) => void
  onMarkerClick?: (id: string) => void
  /** Solo se llama cuando el usuario mueve el mapa (no en los encuadres automáticos). */
  onMoveEnd?: (center: LngLat) => void
  /** Si cambia, el mapa se centra en este punto con un zoom cercano. */
  focus?: LngLat | null
  /** Encuadrar automáticamente los marcadores y la ruta (por defecto, sí). */
  autoFit?: boolean
  className?: string
  /** Espacio reservado al ajustar la vista, p. ej. para una hoja inferior. */
  padding?: { top: number; right: number; bottom: number; left: number }
}

const SPAIN_CENTER: LngLat = [-3.7, 40.2]
const ROUTE_SOURCE = "plg-route"

const kindClass: Record<MapMarker["kind"], string> = {
  origin: "size-8 rounded-full bg-primary text-primary-foreground",
  stop: "size-8 rounded-full bg-card text-foreground border border-border",
  destination: "size-8 rounded-full bg-fuel text-fuel-foreground",
  station: "h-7 min-w-12 rounded-full bg-card px-2 text-xs text-foreground border border-border tabular-nums",
  center: "size-4 rounded-full bg-primary",
  live: "relative size-7 rounded-full",
}

function markerElement(marker: MapMarker, onClick?: (id: string) => void) {
  // MapLibre coloca el elemento con `transform: translate(...)`. La propiedad CSS `scale` se aplica
  // por fuera de ese transform y multiplicaría la traslación, así que el escalado va en un hijo.
  const el = document.createElement("div")
  if (marker.selected) el.className = "z-10"
  if (marker.kind === "live") {
    // Punto con halo que late: «aquí está ahora». El halo se detiene con «reducir movimiento».
    el.className = "relative flex size-7 items-center justify-center"
    el.innerHTML =
      '<span class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-50 motion-reduce:animate-none"></span>' +
      '<span class="relative size-4 rounded-full bg-primary ring-2 ring-white shadow-md"></span>'
    el.setAttribute("role", "img")
    el.setAttribute("aria-label", marker.label ?? "Ubicación en vivo")
    return el
  }
  const inner = document.createElement("div")
  inner.className = cn(
    "flex items-center justify-center text-sm font-semibold shadow-md ring-2 ring-background",
    kindClass[marker.kind],
    marker.best && "border-success bg-success text-white",
    marker.selected && "scale-125 ring-primary",
    onClick && marker.kind === "station" && "cursor-pointer",
  )
  inner.textContent = marker.label ?? ""
  if (onClick && marker.kind === "station") {
    inner.setAttribute("role", "button")
    inner.setAttribute("aria-label", `Gasolinera ${marker.label ?? ""}`)
    inner.tabIndex = 0
    inner.addEventListener("click", (e) => {
      e.stopPropagation()
      onClick(marker.id)
    })
    inner.addEventListener("keydown", (e) => e.key === "Enter" && onClick(marker.id))
  }
  el.appendChild(inner)
  return el
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function MapView({ markers = [], route = null, onMapClick, onMarkerClick, onMoveEnd, focus = null, autoFit = true, className, padding }: Props) {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === "dark" ? "dark" : "light"
  // next-themes no conoce el tema hasta montarse; crear el mapa antes provocaría cargar dos estilos.
  const themeKnown = resolvedTheme !== undefined

  const [failed, setFailed] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerObjs = useRef<Marker[]>([])
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null)
  const appliedTheme = useRef<"light" | "dark" | null>(null)
  const lastFitKey = useRef<string | null>(null)

  // Los últimos valores, accesibles desde los callbacks del mapa sin recrearlo.
  const latest = useRef<{
    route: Props["route"]
    markers: MapMarker[]
    onMapClick: Props["onMapClick"]
    onMarkerClick: Props["onMarkerClick"]
    onMoveEnd: Props["onMoveEnd"]
    autoFit: boolean
    padding: Props["padding"]
    theme: "light" | "dark"
  }>({ route, markers, onMapClick, onMarkerClick, onMoveEnd, autoFit, padding, theme })
  // Debe ir antes que el resto de efectos: estos leen `latest` al ejecutarse.
  useEffect(() => {
    latest.current = { route, markers, onMapClick, onMarkerClick, onMoveEnd, autoFit, padding, theme }
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
    const { route, markers, padding, autoFit } = latest.current
    if (!autoFit) return
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
    if (!themeKnown) return
    let disposed = false
    let map: MapLibreMap | null = null

    ;(async () => {
      try {
        // MapLibre inicializa WebGL de forma asíncrona y el error no se puede capturar después.
        if (!document.createElement("canvas").getContext("webgl2")) throw new Error("WebGL2 no disponible")
        const [maplibre, style] = await Promise.all([import("maplibre-gl"), loadMapStyle(latest.current.theme)])
        if (disposed || !containerRef.current) return
        // El worker se sirve desde /public (ver scripts/copy-maplibre-worker.mjs).
        maplibre.setWorkerUrl(`${window.location.origin}/maplibre-gl-worker.mjs`)
        maplibreRef.current = maplibre
        appliedTheme.current = latest.current.theme

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
      map.on("error", (e) => console.error("MapLibre:", e.error ?? e))
      map.on("click", (e) => latest.current.onMapClick?.([e.lngLat.lng, e.lngLat.lat]))
      map.on("moveend", (e) => {
        if (!(e as { originalEvent?: unknown }).originalEvent || !map) return
        const c = map.getCenter()
        latest.current.onMoveEnd?.([c.lng, c.lat])
      })
      map.on("style.load", () => map && drawRoute(map))
      map.on("load", () => {
        if (!map) return
        setMapReady(true)
        drawRoute(map)
        fit(map)
      })
    })()

    return () => {
      disposed = true
      markerObjs.current.forEach((m) => m.remove())
      markerObjs.current = []
      map?.remove()
      mapRef.current = null
      appliedTheme.current = null
      setMapReady(false)
    }
  }, [themeKnown])

  // Cambio de tema: se recarga el estilo; la ruta se redibuja en `style.load`.
  useEffect(() => {
    const map = mapRef.current
    if (!map || appliedTheme.current === theme) return
    appliedTheme.current = theme
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
  }, [route, mapReady])

  // Foco: centra el mapa en un punto concreto (p. ej. la gasolinera elegida en la lista).
  const focusKey = focus ? `${focus[0]},${focus[1]}` : null
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focus) return
    // Con el padding, «centro» es el centro de la zona visible (no el que queda bajo el panel o la hoja).
    map.easeTo({ center: focus, zoom: Math.max(map.getZoom(), 14), padding: latest.current.padding, duration: prefersReducedMotion() ? 0 : 500 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, mapReady])

  // Marcadores.
  useEffect(() => {
    const map = mapRef.current
    const maplibre = maplibreRef.current
    if (!map || !maplibre) return
    markerObjs.current.forEach((m) => m.remove())
    markerObjs.current = markers.map((marker) =>
      new maplibre.Marker({ element: markerElement(marker, (id) => latest.current.onMarkerClick?.(id)) })
        .setLngLat(marker.lngLat)
        .addTo(map),
    )
    // Solo se reencuadra si cambian los puntos, no al resaltar o seleccionar un marcador.
    const fitKey = markers.map((m) => `${m.id}:${m.lngLat[0]},${m.lngLat[1]}`).join("|")
    if (!(route && route.length > 1) && fitKey !== lastFitKey.current) {
      lastFitKey.current = fitKey
      fit(map)
    }
  }, [markers, route, mapReady])

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
