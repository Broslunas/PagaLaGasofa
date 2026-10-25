"use client"

import { Clock, Loader2, MapPinOff, Navigation, Square } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { shouldSendPosition } from "@/lib/live/logic"

type Status = "idle" | "starting" | "sharing" | "denied" | "unavailable"

/** Controles del conductor: envía su posición mientras la pantalla esté abierta. */
export function LiveSharer({ shareId }: { shareId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const watchId = useRef<number | null>(null)
  const last = useRef<{ lat: number; lng: number; t: number } | null>(null)
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const releaseWakeLock = useCallback(() => {
    void wakeLock.current?.release().catch(() => {})
    wakeLock.current = null
  }, [])

  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && document.visibilityState === "visible") wakeLock.current = await navigator.wakeLock.request("screen")
    } catch {
      // Sin soporte o denegado: el envío sigue, pero la pantalla puede apagarse.
    }
  }, [])

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = null
    releaseWakeLock()
  }, [releaseWakeLock])

  useEffect(() => {
    // Al volver a la pestaña hay que pedir de nuevo el bloqueo de pantalla.
    const onVisible = () => status === "sharing" && document.visibilityState === "visible" && void acquireWakeLock()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      stopWatching()
    }
  }, [status, acquireWakeLock, stopWatching])

  async function send(pos: GeolocationPosition) {
    const sample = { lat: pos.coords.latitude, lng: pos.coords.longitude, t: pos.timestamp }
    setAccuracy(Math.round(pos.coords.accuracy))
    if (!shouldSendPosition(last.current, sample)) return
    last.current = sample
    const res = await fetch(`/api/live/${shareId}/position`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: sample.lat,
        lng: sample.lng,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading ?? null,
        speed: pos.coords.speed ?? null,
      }),
    }).catch(() => null)
    if (res?.status === 410) {
      stopWatching()
      setStatus("idle")
      setMessage("La sesión ha terminado.")
      return router.refresh()
    }
    setFailed(!res?.ok)
    if (res?.ok) setSentAt(Date.now())
  }

  function start() {
    if (!("geolocation" in navigator)) return setStatus("unavailable")
    setStatus("starting")
    setMessage(null)
    last.current = null
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("sharing")
        void send(pos)
      },
      (error) => {
        stopWatching()
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable")
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    )
    void acquireWakeLock()
  }

  async function stopSession() {
    setBusy(true)
    stopWatching()
    await fetch(`/api/live/${shareId}`, { method: "DELETE" }).catch(() => null)
    setBusy(false)
    setStatus("idle")
    router.refresh()
  }

  async function extend() {
    setBusy(true)
    const res = await fetch(`/api/live/${shareId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hours: 4 }) }).catch(() => null)
    setBusy(false)
    setMessage(res?.ok ? "Sesión ampliada: caduca dentro de 4 horas." : "No se pudo ampliar la sesión.")
    if (res?.ok) router.refresh()
  }

  const sharing = status === "sharing" || status === "starting"

  return (
    <section aria-labelledby="sharer-h" className="space-y-3 rounded-2xl border bg-primary-soft/50 p-4">
      <h2 id="sharer-h" className="flex items-center gap-2 text-sm font-semibold">
        <Navigation className="size-4" /> Tu ubicación
      </h2>

      {!sharing ? (
        <>
          <p className="text-sm text-muted-foreground">
            Al empezar, el navegador te pedirá permiso. Solo se comparte la posición actual, nunca el recorrido, y se borra al terminar.
          </p>
          <Button onClick={start}>
            <Navigation /> Empezar a compartir
          </Button>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm" aria-live="polite">
            {status === "starting" ? <Loader2 className="size-4 animate-spin" /> : <span className="size-2.5 animate-pulse rounded-full bg-success motion-reduce:animate-none" />}
            {status === "starting" ? "Buscando tu posición…" : failed ? "Reintentando el envío…" : "Compartiendo en directo"}
            {accuracy !== null && <span className="text-muted-foreground">· precisión {accuracy} m</span>}
          </p>
          <p className="text-xs text-muted-foreground">Mantén esta pantalla abierta: si el navegador pasa a segundo plano, el envío se interrumpe.</p>
        </>
      )}

      {status === "denied" && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <MapPinOff className="mt-0.5 size-4 shrink-0" /> El navegador tiene bloqueada tu ubicación para este sitio. Actívala en los ajustes y vuelve a intentarlo.
        </p>
      )}
      {status === "unavailable" && <p role="alert" className="text-sm text-destructive">No se ha podido obtener tu posición. Comprueba el GPS y la conexión.</p>}

      <div className="flex flex-wrap gap-2">
        {sharing && (
          <Button variant="outline" onClick={stopSession} disabled={busy}>
            <Square /> Dejar de compartir
          </Button>
        )}
        <Button variant="ghost" onClick={extend} disabled={busy}>
          <Clock /> Ampliar 4 h
        </Button>
        {!sharing && (
          <Button variant="ghost" onClick={stopSession} disabled={busy}>
            Terminar sesión
          </Button>
        )}
      </div>
      <p role="status" aria-live="polite" className="min-h-4 text-xs text-muted-foreground">{message}{sentAt && !message ? "" : ""}</p>
    </section>
  )
}
