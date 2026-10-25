"use client"

import { useSyncExternalStore } from "react"

import { CONSENT_KEY, parseConsent, type Consent } from "@/lib/consent"

type Snapshot = Consent | null | "unknown"
const listeners = new Set<() => void>()

let cached: { raw: string | null; value: Consent | null } | null = null
function read(): Snapshot {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    // El mismo objeto mientras no cambie el valor guardado (useSyncExternalStore lo exige).
    if (!cached || cached.raw !== raw) cached = { raw, value: parseConsent(raw) }
    return cached.value
  } catch {
    return null
  }
}

export function saveConsent(consent: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  } catch {
    // Sin almacenamiento: la decisión vale solo para esta visita (el banner volverá a aparecer).
  }
  listeners.forEach((l) => l())
}

let preferencesOpen = false
const prefListeners = new Set<() => void>()
export function openCookiePreferences() {
  preferencesOpen = true
  prefListeners.forEach((l) => l())
}
export function closeCookiePreferences() {
  preferencesOpen = false
  prefListeners.forEach((l) => l())
}

/** `"unknown"` en el servidor y durante la hidratación; luego el consentimiento guardado o `null` si falta. */
export function useConsent(): Snapshot {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      window.addEventListener("storage", cb)
      return () => {
        listeners.delete(cb)
        window.removeEventListener("storage", cb)
      }
    },
    read,
    () => "unknown",
  )
}

export function usePreferencesOpen() {
  return useSyncExternalStore(
    (cb) => {
      prefListeners.add(cb)
      return () => void prefListeners.delete(cb)
    },
    () => preferencesOpen,
    () => false,
  )
}
