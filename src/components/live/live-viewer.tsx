"use client"

import { Crosshair, Gauge, Radio, WifiOff } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import { MapView, type MapMarker } from "@/components/map/map-view"
import { Button } from "@/components/ui/button"
import { useNow } from "@/hooks/use-now"
import type { LiveDto } from "@/lib/live/server"
import { isStale } from "@/lib/live/logic"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { LngLat } from "@/lib/routing/types"
import { cn } from "@/lib/utils"

const POLL_MS = 15_000

function agoLabel(seconds: number) {
  if (seconds < 10) return "ahora mismo"
  if (seconds < 60) return `hace ${seconds} s`
  const m = Math.round(seconds / 60)
  return m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`
}

export function LiveViewer({ initial }: { initial: LiveDto }) {
  const shareId = initial.shareId
  const [dto, setDto] = useState(initial)
  const [follow, setFollow] = useState(true)
  const now = useNow(5000)

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/${shareId}`, { cache: "no-store" })
      if (res.ok) setDto((await res.json()) as LiveDto)
    } catch {
      // Sin red: se mantiene lo último que se vio.
    }
  }, [shareId])

  // Tiempo real: el mensaje solo avisa de que hay algo nuevo; la posición se pide al servidor.
  // Además se consulta cada 15 s y al volver a la pestaña, por si Realtime no está disponible.
  useEffect(() => {
    let last = 0
    const throttled = () => {
      const t = Date.now()
      if (t - last < 800) return
      last = t
      void refetch()
    }
    const timer = setInterval(() => document.visibilityState === "visible" && throttled(), POLL_MS)
    const onVisible = () => document.visibilityState === "visible" && throttled()
    document.addEventListener("visibilitychange", onVisible)

    let cleanup = () => {}
    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const channel = supabase.channel(`live-${shareId}`).on("broadcast", { event: "changed" }, throttled).subscribe()
      cleanup = () => void supabase.removeChannel(channel)
    }
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      cleanup()
    }
  }, [shareId, refetch])

  const { position, trip, state } = dto
  const age = position ? Math.max(0, Math.round((now - new Date(position.at).getTime()) / 1000)) : null
  const stale = state === "active" && isStale(age)

  const markers = useMemo<MapMarker[]>(() => {
    const out: MapMarker[] = []
    trip?.stops.forEach((s, i) => {
      const last = i === trip.stops.length - 1
      out.push({ id: `s${i}`, kind: i === 0 ? "origin" : last ? "destination" : "stop", label: i === 0 ? "A" : last ? "B" : String(i), lngLat: [s.lng, s.lat] })
    })
    if (position) out.push({ id: "live", kind: "live", label: dto.title ?? "Ubicación en vivo", lngLat: [position.lng, position.lat] })
    return out
  }, [trip, position, dto.title])

  const focus = useMemo<LngLat | null>(() => (follow && position ? [position.lng, position.lat] : null), [follow, position])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
            state !== "active" ? "bg-muted text-muted-foreground" : stale ? "bg-warning/20 text-foreground" : "bg-success/15 text-success",
          )}
          role="status"
        >
          {state !== "active" ? <WifiOff className="size-4" /> : <Radio className={cn("size-4", !stale && "animate-pulse motion-reduce:animate-none")} />}
          {state === "stopped" ? "Terminada" : state === "expired" ? "Caducada" : stale ? "Sin señal reciente" : "En directo"}
        </span>
        {state === "active" && age !== null && <span className="text-sm text-muted-foreground">Actualizado {agoLabel(age)}</span>}
        {state === "active" && !position && <span className="text-sm text-muted-foreground">Esperando la primera posición…</span>}
      </div>

      <div className="relative h-[55dvh] min-h-72 overflow-hidden rounded-2xl border">
        <MapView
          markers={markers}
          route={trip?.geometry}
          focus={focus}
          autoFit={!position}
          onMoveEnd={() => setFollow(false)}
        />
        {state === "active" && position && !follow && (
          <Button size="sm" className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 shadow-lg" onClick={() => setFollow(true)}>
            <Crosshair /> Seguir
          </Button>
        )}
        {state !== "active" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 p-6 text-center backdrop-blur-sm">
            <div className="space-y-3">
              <p className="font-medium">{state === "stopped" ? "El conductor ha dejado de compartir su ubicación." : "Esta sesión de ubicación ha caducado."}</p>
              {trip && (
                <Button asChild variant="outline">
                  <Link href={`/t/${trip.shareId}`}>Ver el ticket del viaje</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {state === "active" && position && (
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {position.speedKmh !== null && (
            <div className="rounded-xl border bg-card p-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground"><Gauge className="size-4" /> Velocidad</dt>
              <dd className="text-lg font-semibold tabular-nums">{position.speedKmh} km/h</dd>
            </div>
          )}
          {position.accuracyM !== null && (
            <div className="rounded-xl border bg-card p-3">
              <dt className="text-muted-foreground">Precisión</dt>
              <dd className="text-lg font-semibold tabular-nums">± {Math.round(position.accuracyM)} m</dd>
            </div>
          )}
          <div className="rounded-xl border bg-card p-3">
            <dt className="text-muted-foreground">Termina</dt>
            <dd className="text-lg font-semibold">{new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(dto.expiresAt))}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
