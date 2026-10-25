"use client"

import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"

import { MapView, type MapMarker } from "@/components/map/map-view"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { formatPrice } from "@/lib/format"
import { fetchRoute, reverseGeocode, toLngLat } from "@/lib/routing/client"
import { isStationFuel } from "@/lib/stations/types"
import type { LngLat } from "@/lib/routing/types"
import { cn } from "@/lib/utils"

import { BottomSheet, type SnapPoint } from "./bottom-sheet"
import { StepPassengers } from "./step-passengers"
import { StepRoute } from "./step-route"
import { StepSummary } from "./step-summary"
import { StepVehicle, type RouteStationsState } from "./step-vehicle"
import { computeOutcome, initialState, reducer, stepIssues, stopPlaces, STEPS, type Step } from "./state"

export function TripPlanner() {
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [snap, setSnap] = useState<SnapPoint>("half")
  const [sheetHeight, setSheetHeight] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [routeStations, setRouteStations] = useState<RouteStationsState>({ status: "idle", data: null })

  const places = stopPlaces(state)
  const placesKey = places.map((p) => `${p.lat},${p.lng}`).join("|")

  // Recalcula la ruta cuando cambian los lugares (origen, paradas o destino).
  useEffect(() => {
    if (!state.origin || !state.destination || state.waypoints.some((w) => !w)) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      dispatch({ type: "route-loading" })
      fetchRoute(stopPlaces(state), controller.signal)
        .then((route) => dispatch({ type: "route-loaded", route }))
        .catch((e: Error) => e.name !== "AbortError" && dispatch({ type: "route-error", message: e.message }))
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // `state` completo no es dependencia: basta con que cambien las coordenadas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesKey])

  // Gasolineras a menos de 3 km de la ruta, para el combustible elegido.
  const routeKey = state.route ? `${state.route.distanceKm}:${state.route.geometry.length}` : null
  useEffect(() => {
    const geometry = state.route?.geometry
    // Sin ruta o con un eléctrico no hay nada que pedir; la interfaz ya oculta los datos antiguos.
    if (!geometry || !isStationFuel(state.fuelType)) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setRouteStations((s) => ({ ...s, status: "loading" }))
      try {
        const res = await fetch("/api/stations/along-route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geometry, fuel: state.fuelType, radiusKm: 3, limit: 15 }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error()
        setRouteStations({ status: "ready", data: await res.json() })
      } catch (e) {
        if ((e as Error).name !== "AbortError") setRouteStations({ status: "error", data: null })
      }
    }, 400)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // La ruta se identifica por `routeKey`; no hace falta reaccionar al objeto completo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, state.fuelType])

  // Clic en el mapa: completa el primer hueco (origen, destino, parada vacía).
  const onMapClick = useCallback(
    async ([lng, lat]: LngLat) => {
      const place = await reverseGeocode({ lat, lng }).catch(() => null)
      if (!place) return
      if (!state.origin) dispatch({ type: "origin", place })
      else if (!state.destination) dispatch({ type: "destination", place })
      else {
        const empty = state.waypoints.findIndex((w) => !w)
        if (empty >= 0) dispatch({ type: "waypoint-set", index: empty, place })
      }
    },
    [state.origin, state.destination, state.waypoints],
  )

  const markers = useMemo<MapMarker[]>(() => {
    const out: MapMarker[] = []
    if (state.origin) out.push({ id: "o", kind: "origin", label: "A", lngLat: toLngLat(state.origin) })
    state.waypoints.forEach((w, i) => w && out.push({ id: `w${i}`, kind: "stop", label: String(i + 1), lngLat: toLngLat(w) }))
    if (state.destination) out.push({ id: "d", kind: "destination", label: "B", lngLat: toLngLat(state.destination) })
    // En el paso de costes se ven en el mapa las gasolineras de la ruta, con la más barata resaltada.
    if (state.step === "vehicle" && state.route && routeStations.status === "ready" && routeStations.data && isStationFuel(state.fuelType)) {
      const fuel = state.fuelType
      const min = routeStations.data.stats.min
      routeStations.data.stations.forEach((s) =>
        out.push({ id: `st${s.id}`, kind: "station", lngLat: [s.lng, s.lat], label: formatPrice(s.prices[fuel] as number), best: s.prices[fuel] === min }),
      )
    }
    return out
  }, [state.origin, state.destination, state.waypoints, state.step, state.fuelType, state.route, routeStations])

  const padding = useMemo(
    () => (isDesktop ? { top: 60, right: 60, bottom: 60, left: 480 } : { top: 70, right: 40, bottom: sheetHeight + 40, left: 40 }),
    [isDesktop, sheetHeight],
  )

  const issues = stepIssues(state)
  const outcome = useMemo(() => (issues.route || issues.vehicle ? null : computeOutcome(state)), [state, issues.route, issues.vehicle])
  const result = outcome?.ok ? outcome.result : null

  const index = STEPS.findIndex((s) => s.id === state.step)
  const current = STEPS[index]
  const isLast = index === STEPS.length - 1
  const blocker = state.step === "summary" ? issues.summary : issues[state.step]

  function goTo(step: Step) {
    dispatch({ type: "step", step })
    bodyRef.current?.scrollTo({ top: 0 })
  }

  async function submit() {
    if (!outcome?.ok) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outcome.draft),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el ticket")
      router.push(`/t/${data.shareId}`)
    } catch (e) {
      setSubmitError((e as Error).message)
      setSubmitting(false)
    }
  }

  const header = (
    <div>
      <ol className="flex items-center gap-1.5" aria-label="Pasos">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex-1">
            <button
              type="button"
              data-nodrag
              disabled={i > index && Boolean(issues[STEPS[i - 1].id])}
              onClick={() => goTo(s.id)}
              aria-current={s.id === state.step ? "step" : undefined}
              className="group flex w-full flex-col gap-1 text-left disabled:opacity-50"
            >
              <span className={cn("h-1 rounded-full transition-colors", i <= index ? "bg-primary" : "bg-border")} />
              <span className={cn("text-xs", s.id === state.step ? "font-semibold" : "text-muted-foreground")}>{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )

  const body = (
    <div ref={bodyRef} className="pt-2">
      {state.step === "route" && <StepRoute state={state} dispatch={dispatch} />}
      {state.step === "vehicle" && <StepVehicle state={state} dispatch={dispatch} routeStations={routeStations} />}
      {state.step === "passengers" && <StepPassengers state={state} dispatch={dispatch} result={result} />}
      {state.step === "summary" && outcome?.ok && (
        <StepSummary state={state} dispatch={dispatch} draft={outcome.draft} result={outcome.result} />
      )}
    </div>
  )

  const footer = (
    <div className="space-y-2">
      <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
        {submitError ? <span className="text-destructive">{submitError}</span> : blocker}
      </p>
      <div className="flex gap-2">
        {index > 0 && (
          <Button type="button" variant="outline" size="lg" onClick={() => goTo(STEPS[index - 1].id)} aria-label="Paso anterior">
            <ArrowLeft />
          </Button>
        )}
        {isLast ? (
          <Button type="button" size="lg" className="flex-1" disabled={Boolean(blocker) || submitting} onClick={submit}>
            {submitting ? <Loader2 className="animate-spin" /> : <Check />}
            {submitting ? "Creando…" : "Crear ticket"}
          </Button>
        ) : (
          <Button type="button" size="lg" className="flex-1" disabled={Boolean(blocker)}
            onClick={() => goTo(STEPS[index + 1].id)}>
            Siguiente <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] flex-1 overflow-hidden">
      <MapView className="absolute inset-0" markers={markers} route={state.route?.geometry} onMapClick={onMapClick} padding={padding} />

      {isDesktop ? (
        <aside
          aria-label={`Calculador de viaje: ${current.label}`}
          className="absolute top-4 bottom-4 left-4 z-20 flex w-[26rem] flex-col rounded-2xl border bg-card shadow-xl"
        >
          <div className="px-4 pt-4 pb-2">{header}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{body}</div>
          <div className="border-t px-4 py-3">{footer}</div>
        </aside>
      ) : (
        <BottomSheet header={header} footer={footer} snap={snap} onSnapChange={setSnap} onHeightChange={setSheetHeight}>
          {body}
        </BottomSheet>
      )}
    </div>
  )
}
