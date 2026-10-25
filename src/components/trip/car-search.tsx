"use client"

import { Loader2, Search } from "lucide-react"
import { useEffect, useState } from "react"

import { FUEL_INFO, type FuelType } from "@/lib/trip/fuel"

import { TextInput } from "./fields"

interface CarResult {
  id: number
  make: string
  model: string
  fuelType: FuelType
  consumptionPer100km: number
}

export function CarSearch({ onPick }: { onPick: (car: CarResult) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CarResult[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [picked, setPicked] = useState(false)

  const q = query.trim()
  const searching = q.length >= 2 && !picked

  useEffect(() => {
    if (!searching) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setStatus("loading")
      try {
        const res = await fetch(`/api/car-models?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        if (!res.ok) throw new Error()
        setResults(((await res.json()) as { results: CarResult[] }).results)
        setStatus("idle")
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error")
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q, searching])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <TextInput
          type="search"
          value={query}
          placeholder="Busca tu coche: «Seat Ibiza», «Tesla 3»…"
          aria-label="Buscar modelo de coche"
          className="pl-9"
          onChange={(e) => {
            setQuery(e.target.value)
            setPicked(false)
          }}
        />
        {status === "loading" && searching && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {searching && (
        <ul className="overflow-hidden rounded-xl border bg-card">
          {status === "error" && <li className="px-3 py-2 text-sm text-destructive">No se pudo buscar. Inténtalo de nuevo.</li>}
          {status === "idle" && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados. Introduce el consumo a mano.</li>
          )}
          {results.map((car) => (
            <li key={car.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                onClick={() => {
                  setPicked(true)
                  setQuery(`${car.make} ${car.model}`)
                  onPick(car)
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {car.make} {car.model}
                  </span>
                  <span className="block text-xs text-muted-foreground">{FUEL_INFO[car.fuelType].label}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {String(car.consumptionPer100km).replace(".", ",")} {FUEL_INFO[car.fuelType].unit}/100
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
