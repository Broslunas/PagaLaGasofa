"use client"

import { Download, Share, X } from "lucide-react"
import { useEffect, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "plg:install-dismissed"
const DISMISS_MS = 30 * 24 * 3600 * 1000

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_MS
  } catch {
    return false
  }
}

const noopSubscribe = () => () => {}

/** Contexto del navegador, leído sin efectos: «ios» (Safari sin evento de instalación), «installed/dismissed» (no molestar) o «other». */
function readContext(): "ios" | "skip" | "other" {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true
  if (standalone || dismissedRecently()) return "skip"
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent)
  return ios ? "ios" : "other"
}

/** Invitación a instalar la app: nativa donde el navegador la ofrece, y con instrucciones en iOS. */
export function InstallPrompt() {
  const context = useSyncExternalStore(noopSubscribe, readContext, () => "skip" as const)
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setClosed(true)
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
    setClosed(true)
  }

  async function install() {
    if (!event) return
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === "accepted") setClosed(true)
    else dismiss()
  }

  const ios = context === "ios"
  if (closed || context === "skip" || (!event && !ios)) return null

  return (
    <section aria-label="Instalar la app" className="flex items-start gap-3 rounded-2xl bg-primary-soft p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Instala PagaLaGasofa</p>
        {ios ? (
          <p className="text-sm text-muted-foreground">
            Pulsa <Share className="inline size-4 align-text-bottom" aria-label="Compartir" /> y luego «Añadir a pantalla de inicio». Así se abre como una app y puedes recibir avisos.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Ábrela desde tu pantalla de inicio, a pantalla completa y con avisos de precio.</p>
        )}
        {!ios && (
          <Button size="sm" className="mt-3" onClick={install}>
            <Download /> Instalar
          </Button>
        )}
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Ahora no" onClick={dismiss}>
        <X />
      </Button>
    </section>
  )
}
