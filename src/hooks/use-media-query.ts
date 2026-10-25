"use client"

import { useSyncExternalStore } from "react"

/** `serverValue` es lo que se devuelve en el servidor y en la hidratación. */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", notify)
      return () => mql.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}
