"use client"

import { BellRing, Laptop, Loader2, Mail, Smartphone, Trash2 } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { currentSubscription, pushSupport, subscribeToPush, unsubscribeFromPush } from "@/lib/push/client"

interface Device {
  id: string
  userAgent: string | null
  createdAt: string
  current: boolean
}

function deviceName(ua: string | null) {
  if (!ua) return "Dispositivo"
  const os = /android/i.test(ua) ? "Android" : /iphone|ipad/i.test(ua) ? "iOS" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Dispositivo"
  const browser = /edg\//i.test(ua) ? "Edge" : /firefox/i.test(ua) ? "Firefox" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : ""
  return [browser, os].filter(Boolean).join(" en ")
}

export function NotificationSettings() {
  const [email, setEmail] = useState<{ address: string | null; enabled: boolean } | null | "anonymous">(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [thisEndpoint, setThisEndpoint] = useState<string | null>(null)
  const [support, setSupport] = useState<ReturnType<typeof pushSupport>>("supported")
  const [permission, setPermission] = useState<NotificationPermission | "n/a">("n/a")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const loadDevices = useCallback(async (endpoint: string | null) => {
    const res = await fetch(`/api/push/subscriptions${endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : ""}`)
    if (res.ok) setDevices(((await res.json()) as { devices: Device[] }).devices)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const settings = await fetch("/api/account/settings")
      if (cancelled) return
      if (settings.status === 401) return setEmail("anonymous")
      const data = (await settings.json()) as { notifyEmail: boolean; email: string | null }
      setEmail({ address: data.email, enabled: data.notifyEmail })

      setSupport(pushSupport())
      setPermission("Notification" in window ? Notification.permission : "n/a")
      const sub = await currentSubscription()
      if (cancelled) return
      setThisEndpoint(sub?.endpoint ?? null)
      await loadDevices(sub?.endpoint ?? null)
    })().catch(() => setMessage({ text: "No se pudieron cargar los ajustes.", ok: false }))
    return () => {
      cancelled = true
    }
  }, [loadDevices])

  async function togglePush(on: boolean) {
    setBusy(true)
    setMessage(null)
    if (on) {
      const result = await subscribeToPush()
      if (result === "denied") setMessage({ text: "El navegador tiene bloqueadas las notificaciones para este sitio. Actívalas en los ajustes del navegador.", ok: false })
      else if (result !== "subscribed") setMessage({ text: "No se pudieron activar las notificaciones en este dispositivo.", ok: false })
    } else {
      await unsubscribeFromPush()
    }
    setPermission("Notification" in window ? Notification.permission : "n/a")
    const sub = await currentSubscription()
    setThisEndpoint(sub?.endpoint ?? null)
    await loadDevices(sub?.endpoint ?? null)
    setBusy(false)
  }

  async function toggleEmail(enabled: boolean) {
    if (!email || email === "anonymous") return
    setEmail({ ...email, enabled })
    const res = await fetch("/api/account/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notifyEmail: enabled }) })
    if (!res.ok) setEmail({ ...email, enabled: !enabled })
  }

  async function revoke(id: string) {
    await fetch(`/api/push/subscriptions?id=${id}`, { method: "DELETE" })
    const sub = await currentSubscription()
    if (sub && devices.find((d) => d.id === id)?.current) await sub.unsubscribe().catch(() => {})
    setThisEndpoint((await currentSubscription())?.endpoint ?? null)
    await loadDevices((await currentSubscription())?.endpoint ?? null)
  }

  async function sendTest() {
    setBusy(true)
    setMessage(null)
    const res = await fetch("/api/notifications/test", { method: "POST" }).catch(() => null)
    setBusy(false)
    if (!res?.ok) return setMessage({ text: "No se pudo enviar la prueba.", ok: false })
    const r = (await res.json()) as { push: number; email: boolean }
    setMessage({ text: `Enviada al centro de notificaciones, a ${r.push} dispositivo(s)${r.email ? " y por correo" : ""}.`, ok: true })
  }

  if (email === null) return <div className="h-48 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
  if (email === "anonymous") {
    return (
      <div className="space-y-3 rounded-2xl border bg-card p-6 text-center">
        <p className="text-muted-foreground">Inicia sesión para recibir avisos cuando baje el precio de tus gasolineras favoritas.</p>
        <Button asChild><Link href="/login?next=/ajustes/notificaciones">Iniciar sesión</Link></Button>
      </div>
    )
  }

  const pushOn = Boolean(thisEndpoint)
  return (
    <div className="space-y-6">
      <section aria-labelledby="push-h" className="space-y-3 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="push-h" className="flex items-center gap-2 font-semibold"><BellRing className="size-4" /> Avisos en este dispositivo</h2>
            <p className="text-sm text-muted-foreground">Una notificación del navegador cuando baje el precio, aunque la app esté cerrada.</p>
          </div>
          <Switch checked={pushOn} disabled={busy || support !== "supported"} onCheckedChange={togglePush} aria-label="Avisos en este dispositivo" />
        </div>
        {support === "needs-install" && (
          <p className="rounded-xl bg-muted p-3 text-sm">En iPhone y iPad hay que añadir PagaLaGasofa a la pantalla de inicio (Compartir → «Añadir a pantalla de inicio») y abrirla desde ahí.</p>
        )}
        {support === "unsupported" && <p className="rounded-xl bg-muted p-3 text-sm">Este navegador no admite notificaciones push.</p>}
        {permission === "denied" && <p className="rounded-xl bg-muted p-3 text-sm">Las notificaciones están bloqueadas para este sitio en el navegador.</p>}
      </section>

      <section aria-labelledby="email-h" className="space-y-1 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="email-h" className="flex items-center gap-2 font-semibold"><Mail className="size-4" /> Avisos por email</h2>
            <p className="text-sm text-muted-foreground">{email.address ? `Se enviarán a ${email.address}.` : "Tu cuenta no tiene email."}</p>
          </div>
          <Switch checked={email.enabled} disabled={!email.address} onCheckedChange={toggleEmail} aria-label="Avisos por email" />
        </div>
      </section>

      <section aria-labelledby="devices-h" className="space-y-3">
        <h2 id="devices-h" className="font-semibold">Dispositivos con avisos</h2>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguno todavía.</p>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                {/android|iOS/.test(deviceName(d.userAgent)) ? <Smartphone className="size-4 text-muted-foreground" /> : <Laptop className="size-4 text-muted-foreground" />}
                <span className="min-w-0 flex-1 truncate text-sm">
                  {deviceName(d.userAgent)}
                  {d.current && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-accent-foreground">Este dispositivo</span>}
                </span>
                <Button variant="ghost" size="icon-sm" aria-label={`Quitar ${deviceName(d.userAgent)}`} onClick={() => revoke(d.id)}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={sendTest} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <BellRing />} Enviar notificación de prueba
        </Button>
        <Button asChild variant="ghost"><Link href="/gasolineras/favoritas">Configurar alertas de mis favoritas</Link></Button>
      </div>
      <p role="status" aria-live="polite" className={`min-h-5 text-sm ${message?.ok === false ? "text-destructive" : "text-success"}`}>{message?.text}</p>
    </div>
  )
}
