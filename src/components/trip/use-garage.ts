"use client"

import { useEffect, useState } from "react"

import type { Vehicle } from "@/db/schema"

type GarageState = { status: "loading" } | { status: "anonymous" } | { status: "ready"; vehicles: Vehicle[] }

/** Vehículos del usuario; `anonymous` si no hay sesión. */
export function useGarage() {
  const [state, setState] = useState<GarageState>({ status: "loading" })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/vehicles", { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401) return setState({ status: "anonymous" })
        if (!res.ok) throw new Error()
        const data = (await res.json()) as { vehicles: Vehicle[] }
        setState({ status: "ready", vehicles: data.vehicles })
      })
      .catch((e) => e.name !== "AbortError" && setState({ status: "anonymous" }))
    return () => controller.abort()
  }, [version])

  return { state, reload: () => setVersion((v) => v + 1) }
}
