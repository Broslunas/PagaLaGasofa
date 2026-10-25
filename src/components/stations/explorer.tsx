"use client"

import { Loader2, LocateFixed, Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

import { MapView, type MapMarker } from "@/components/map/map-view"
import { PlaceSearch } from "@/components/map/place-search"
import { BottomSheet, type SnapPoint } from "@/components/trip/bottom-sheet"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useMediaQuery } from "@/hooks/use-media-query"
import { formatPrice } from "@/lib/format"
import { reverseGeocode } from "@/lib/routing/client"
import type { PlaceResult, LngLat } from "@/lib/routing/types"
import type { StationDto, StationFuel } from "@/lib/stations/types"
import { haversineKm } from "@/lib/trip/geo"
import { cn } from "@/lib/utils"

import { FuelChips } from "./fuel-chips"
import { StationCard } from "./station-card"

interface Center {
  lat: number
  lng: number
}

const RADII = [1, 5, 10, 25]
const FUEL_KEY = "plg:station-fuel"

// Combustible recordado entre visitas. Se lee con useSyncExternalStore para no desajustar la hidratación.
const fuelListeners = new Set<() => void>()
function readStoredFuel(): StationFuel {
  try {
    const v = localStorage.getItem(FUEL_KEY)
    if (v === "gasolina95" || v === "gasolina98" || v === "diesel" || v === "dieselPremium" || v === "glp") return v
  } catch {}
  return "gasolina95"
}
function storeFuel(fuel: StationFuel) {
  try { localStorage.setItem(FUEL_KEY, fuel) } catch {}
  fuelListeners.forEach((l) => l())
}
const subscribeFuel = (cb: () => void) => {
  fuelListeners.add(cb)
  return () => void fuelListeners.delete(cb)
}

export function StationsExplorer({ initialCenter }: { initialCenter: Center }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [snap, setSnap] = useState<SnapPoint>("half")
  const [sheetHeight, setSheetHeight] = useState(0)

  const [center, setCenter] = useState<Center>(initialCenter)
  const [centerPlace, setCenterPlace] = useState<PlaceResult | null>(null)
  const fuel = useSyncExternalStore(subscribeFuel, readStoredFuel, () => "gasolina95" as StationFuel)
  const [radius, setRadius] = useState(10)
  const [sort, setSort] = useState<"price" | "distance">("price")
  const [openNow, setOpenNow] = useState(false)
  const [brand, setBrand] = useState("")
  const [brands, setBrands] = useState<{ brand: string; count: number }[]>([])

  const [stations, setStations] = useState<StationDto[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [moved, setMoved] = useState<Center | null>(null)
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const setFuel = storeFuel

  useEffect(() => {
    fetch("/api/stations/brands").then((r) => r.json()).then((d) => setBrands(d.brands ?? [])).catch(() => {})
  }, [])

  // Búsqueda: se repite al cambiar el punto o cualquier filtro.
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setStatus("loading")
      const params = new URLSearchParams({
        lat: center.lat.toFixed(3), lng: center.lng.toFixed(3), radius: String(radius), fuel, sort, open: openNow ? "1" : "0", limit: "40",
      })
      if (brand) params.set("brand", brand)
      try {
        const res = await fetch(`/api/stations?${params}`, { signal: controller.signal })
        if (!res.ok) throw new Error()
        setStations(((await res.json()) as { stations: StationDto[] }).stations)
        setStatus("ready")
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error")
      }
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [center.lat, center.lng, radius, fuel, sort, openNow, brand])

  const best = useMemo(() => {
    const prices = stations.map((s) => s.prices[fuel]).filter((p): p is number => p !== null)
    return prices.length ? Math.min(...prices) : null
  }, [stations, fuel])

  const markers = useMemo<MapMarker[]>(
    () => [
      { id: "center", kind: "center", lngLat: [center.lng, center.lat] },
      ...stations.map((s) => ({
        id: s.id,
        kind: "station" as const,
        lngLat: [s.lng, s.lat] as LngLat,
        label: s.prices[fuel] === null ? "" : formatPrice(s.prices[fuel] as number),
        best: s.prices[fuel] === best,
        selected: s.id === selectedId,
      })),
    ],
    [stations, fuel, best, selectedId, center],
  )

  const selected = stations.find((s) => s.id === selectedId) ?? null
  const focus = useMemo<LngLat | null>(() => (selected ? [selected.lng, selected.lat] : null), [selected])

  const select = useCallback((id: string) => {
    setSelectedId(id)
    document.getElementById(`station-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [])

  function useMyLocation() {
    if (!("geolocation" in navigator)) return setMessage("Tu navegador no permite obtener la ubicación")
    setLocating(true)
    setMessage(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCenter({ lat: coords.latitude, lng: coords.longitude })
        setCenterPlace(null)
        setSelectedId(null)
        setMoved(null)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setMessage("No tenemos permiso para ver tu ubicación")
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  const onMoveEnd = useCallback(
    ([lng, lat]: LngLat) => {
      if (haversineKm(lat, lng, center.lat, center.lng) > 1.5) setMoved({ lat, lng })
    },
    [center],
  )

  async function searchHere() {
    if (!moved) return
    setCenter(moved)
    setCenterPlace(await reverseGeocode(moved).catch(() => null))
    setSelectedId(null)
    setMoved(null)
  }

  const padding = useMemo(
    () => (isDesktop ? { top: 60, right: 60, bottom: 60, left: 480 } : { top: 70, right: 40, bottom: sheetHeight + 40, left: 40 }),
    [isDesktop, sheetHeight],
  )

  const summary = (
    <p className="text-sm" aria-live="polite">
      {status === "loading" ? (
        <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Buscando gasolineras…</span>
      ) : status === "error" ? (
        <span className="text-destructive">No se pudieron cargar las gasolineras.</span>
      ) : stations.length === 0 ? (
        <span className="text-muted-foreground">Sin gasolineras con estos filtros</span>
      ) : (
        <>
          <strong>{stations.length}</strong> gasolineras{best !== null && <> · desde <strong className="text-success">{formatPrice(best)} €/l</strong></>}
        </>
      )}
    </p>
  )

  const filters = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PlaceSearch
          className="flex-1"
          label="Buscar zona"
          placeholder="Ciudad, calle o lugar"
          value={centerPlace}
          onChange={(p) => {
            setCenterPlace(p)
            if (p) {
              setCenter({ lat: p.lat, lng: p.lng })
              setSelectedId(null)
              setMoved(null)
            }
          }}
        />
        <Button type="button" variant="outline" size="icon-lg" onClick={useMyLocation} disabled={locating} aria-label="Usar mi ubicación" title="Usar mi ubicación">
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
        </Button>
      </div>
      {message && <p role="alert" className="text-xs text-destructive">{message}</p>}
      <FuelChips value={fuel} onChange={setFuel} />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Radio</span>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="h-10 w-full rounded-xl border border-input bg-card px-2 text-base">
            {RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Marca</span>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-card px-2 text-base">
            <option value="">Todas</option>
            {brands.map((b) => <option key={b.brand} value={b.brand}>{b.brand}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Ordenar por" className="flex rounded-full border bg-card p-0.5 text-sm">
          {(["price", "distance"] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={sort === s} onClick={() => setSort(s)}
              className={cn("h-8 rounded-full px-3 transition-colors", sort === s ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {s === "price" ? "Precio" : "Distancia"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          Abierto ahora
          <Switch checked={openNow} onCheckedChange={setOpenNow} aria-label="Solo gasolineras abiertas ahora" />
        </label>
      </div>
    </div>
  )

  const list = (
    <ul ref={listRef} className="space-y-2 pt-3">
      {stations.map((s) => (
        <StationCard key={s.id} station={s} fuel={fuel} best={s.prices[fuel] === best} selected={s.id === selectedId} onSelect={() => select(s.id)} />
      ))}
      {status === "ready" && stations.length === 0 && (
        <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay gasolineras en {radius} km con estos filtros. Prueba a ampliar el radio o quitar «Abierto ahora».
        </li>
      )}
    </ul>
  )

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] flex-1 overflow-hidden">
      <MapView
        className="absolute inset-0"
        markers={markers}
        onMarkerClick={select}
        onMoveEnd={onMoveEnd}
        focus={focus}
        padding={padding}
      />

      {moved && (
        <Button
          type="button"
          size="sm"
          onClick={searchHere}
          className={cn("absolute z-30 shadow-lg", isDesktop ? "top-4 left-1/2 ml-52 -translate-x-1/2" : "top-3 left-1/2 -translate-x-1/2")}
        >
          <Search /> Buscar en esta zona
        </Button>
      )}

      {isDesktop ? (
        <aside aria-label="Gasolineras" className="absolute top-4 bottom-4 left-4 z-20 flex w-[26rem] flex-col rounded-2xl border bg-card shadow-xl">
          <div className="space-y-3 border-b p-4">{filters}</div>
          <div className="border-b px-4 py-2">{summary}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{list}</div>
        </aside>
      ) : (
        <BottomSheet header={summary} snap={snap} onSnapChange={setSnap} onHeightChange={setSheetHeight}>
          <div className="space-y-3 pt-1">{filters}</div>
          {list}
        </BottomSheet>
      )}
    </div>
  )
}
