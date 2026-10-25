"use client"

import { useEffect, useState } from "react"

export interface Coords {
  lat: number
  lng: number
}

/**
 * Devuelve la ubicación del usuario solo si ya concedió el permiso antes, sin
 * mostrar ningún aviso. Sirve para sesgar el buscador de direcciones.
 */
export function useGrantedLocation(): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!("geolocation" in navigator) || !navigator.permissions?.query) return

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (status.state !== "granted" || cancelled) return
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!cancelled) setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          },
          () => {},
          { maximumAge: 10 * 60_000, timeout: 5000 },
        )
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return coords
}
