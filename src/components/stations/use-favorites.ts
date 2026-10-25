"use client"

import { useCallback, useEffect, useState } from "react"

type State = { status: "loading" } | { status: "anonymous" } | { status: "ready"; ids: Set<string> }

/** Favoritas del usuario; `anonymous` si no ha iniciado sesión. */
export function useFavorites() {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/favorites", { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401) return setState({ status: "anonymous" })
        if (!res.ok) throw new Error()
        const data = (await res.json()) as { favorites: { station: { id: string } }[] }
        setState({ status: "ready", ids: new Set(data.favorites.map((f) => f.station.id)) })
      })
      .catch((e) => e.name !== "AbortError" && setState({ status: "anonymous" }))
    return () => controller.abort()
  }, [])

  const toggle = useCallback(async (stationId: string, fuelType?: string) => {
    let wasFavorite = false
    setState((s) => {
      if (s.status !== "ready") return s
      wasFavorite = s.ids.has(stationId)
      const ids = new Set(s.ids)
      if (wasFavorite) ids.delete(stationId)
      else ids.add(stationId)
      return { status: "ready", ids }
    })
    const res = await (wasFavorite
      ? fetch(`/api/favorites?stationId=${stationId}`, { method: "DELETE" })
      : fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stationId, fuelType }) })
    ).catch(() => null)
    if (!res?.ok) {
      // Se deshace el cambio provisional.
      setState((s) => {
        if (s.status !== "ready") return s
        const ids = new Set(s.ids)
        if (wasFavorite) ids.add(stationId)
        else ids.delete(stationId)
        return { status: "ready", ids }
      })
    }
  }, [])

  return { state, toggle }
}
