import type { Metadata } from "next"
import { headers } from "next/headers"
import { Suspense } from "react"

import { StationsExplorer } from "@/components/stations/explorer"

export const metadata: Metadata = {
  title: "Gasolineras",
  description: "Precios de gasolina y diésel en las gasolineras de España, actualizados cada hora.",
}

const MADRID = { lat: 40.4168, lng: -3.7038 }

/** Centro inicial: ubicación aproximada que da Vercel por IP (sin pedir permiso) o Madrid. */
async function Explorer() {
  const h = await headers()
  const lat = Number(h.get("x-vercel-ip-latitude"))
  const lng = Number(h.get("x-vercel-ip-longitude"))
  const valid = Number.isFinite(lat) && Number.isFinite(lng) && lat >= 27 && lat <= 44.5 && lng >= -19 && lng <= 5.5
  return <StationsExplorer initialCenter={valid ? { lat, lng } : MADRID} />
}

export default function StationsPage() {
  return (
    <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
      <Explorer />
    </Suspense>
  )
}
