"use client"

import Script from "next/script"

import { ANALYTICS } from "@/lib/consent"

import { useConsent } from "./consent-store"

/** Carga la analítica propia solo si el usuario la ha aceptado. */
export function AnalyticsScripts() {
  const consent = useConsent()
  if (consent === "unknown" || consent === null || !consent.analytics) return null
  return (
    <>
      <Script defer src={ANALYTICS.script} data-website-id={ANALYTICS.websiteId} strategy="afterInteractive" />
      {consent.recording && <Script defer src={ANALYTICS.recorder} data-website-id={ANALYTICS.websiteId} strategy="afterInteractive" />}
    </>
  )
}
