"use client"

import { useEffect, useState } from "react"

/** Hora actual que se refresca cada `intervalMs` (para textos tipo «hace 5 s»). */
export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
