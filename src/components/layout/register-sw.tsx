"use client"

import { useEffect } from "react"

import { registerServiceWorker } from "@/lib/push/client"

/** Registra el service worker (solo notificaciones push; no cachea nada). */
export function RegisterSW() {
  useEffect(() => {
    registerServiceWorker().catch(() => {})
  }, [])
  return null
}
