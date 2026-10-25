"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/client"

/**
 * Mantiene el ticket al día: escucha el canal de Supabase Realtime (broadcast) y, además,
 * refresca al volver a la pestaña por si la conexión en tiempo real no está disponible.
 * El mensaje recibido solo dispara una recarga de datos del servidor.
 */
export function TicketLive({ shareId }: { shareId: string }) {
  const router = useRouter()

  useEffect(() => {
    let last = 0
    const refresh = () => {
      const now = Date.now()
      if (now - last < 1000) return
      last = now
      router.refresh()
    }

    const onVisible = () => document.visibilityState === "visible" && refresh()
    document.addEventListener("visibilitychange", onVisible)

    let cleanup = () => {}
    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const channel = supabase
        .channel(`trip-${shareId}`)
        .on("broadcast", { event: "changed" }, refresh)
        .subscribe()
      cleanup = () => void supabase.removeChannel(channel)
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      cleanup()
    }
  }, [shareId, router])

  return null
}
