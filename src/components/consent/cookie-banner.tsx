"use client"

import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { makeConsent } from "@/lib/consent"

import { closeCookiePreferences, saveConsent, useConsent, usePreferencesOpen } from "./consent-store"

/**
 * Aviso de cookies: «Rechazar» y «Aceptar» pesan lo mismo. No se carga ninguna analítica
 * hasta que se acepta; sin decisión, se trata como un rechazo.
 */
export function CookieBanner() {
  const consent = useConsent()
  const reopened = usePreferencesOpen()
  const [configuring, setConfiguring] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [recording, setRecording] = useState(false)

  const visible = consent !== "unknown" && (consent === null || reopened)
  if (!visible) return null

  const decide = (a: boolean, r: boolean) => {
    saveConsent(makeConsent(a, r))
    closeCookiePreferences()
    setConfiguring(false)
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookies-title"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border bg-card p-5 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:left-5 sm:mx-0 sm:max-w-md"
    >
      <h2 id="cookies-title" className="text-base font-semibold">Tu privacidad, tu decisión</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Usamos lo imprescindible para que la app funcione. Con tu permiso, también medimos cómo se usa para mejorarla.{" "}
        <Link href="/legal/cookies" className="underline underline-offset-4">Más información</Link>
      </p>

      {configuring && (
        <ul className="mt-4 space-y-3">
          <li className="flex items-start justify-between gap-4 rounded-xl bg-muted p-3">
            <span className="text-sm">
              <strong className="block">Imprescindibles</strong>
              <span className="text-muted-foreground">Sesión, permisos de tus tickets y preferencias. Siempre activas.</span>
            </span>
            <Switch checked disabled aria-label="Cookies imprescindibles, siempre activas" />
          </li>
          <li className="flex items-start justify-between gap-4 rounded-xl bg-muted p-3">
            <label htmlFor="c-analytics" className="text-sm">
              <strong className="block">Estadísticas de uso</strong>
              <span className="text-muted-foreground">Páginas vistas y uso general, sin identificarte.</span>
            </label>
            <Switch id="c-analytics" checked={analytics} onCheckedChange={(v) => { setAnalytics(v); if (!v) setRecording(false) }} />
          </li>
          <li className="flex items-start justify-between gap-4 rounded-xl bg-muted p-3">
            <label htmlFor="c-recording" className="text-sm">
              <strong className="block">Grabación de sesiones</strong>
              <span className="text-muted-foreground">Cómo se mueve el cursor y se navega, para detectar fallos. Requiere las estadísticas.</span>
            </label>
            <Switch id="c-recording" checked={recording} disabled={!analytics} onCheckedChange={setRecording} />
          </li>
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" className="flex-1" onClick={() => decide(false, false)}>Rechazar</Button>
        {configuring ? (
          <Button variant="outline" className="flex-1" onClick={() => decide(analytics, recording)}>Guardar elección</Button>
        ) : (
          <Button variant="ghost" className="flex-1" onClick={() => setConfiguring(true)}>Configurar</Button>
        )}
        <Button className="flex-1" onClick={() => decide(true, true)}>Aceptar todo</Button>
      </div>
    </section>
  )
}
