"use client"

import { Loader2, MapPin, X } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { useGrantedLocation } from "@/hooks/use-granted-location"
import { searchPlaces } from "@/lib/routing/client"
import type { PlaceResult } from "@/lib/routing/types"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  placeholder?: string
  value: PlaceResult | null
  onChange: (place: PlaceResult | null) => void
  className?: string
}

export function PlaceSearch({ label, placeholder, value, onChange, className }: Props) {
  const id = useId()
  const listId = `${id}-list`
  const bias = useGrantedLocation()

  const [query, setQuery] = useState(value?.label ?? "")
  const [results, setResults] = useState<PlaceResult[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const abortRef = useRef<AbortController | null>(null)

  // Sincroniza el texto cuando el valor cambia desde fuera (p. ej. clic en el mapa).
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (value) setQuery(value.label)
  }

  useEffect(() => {
    const q = query.trim()
    abortRef.current?.abort()
    // Con un lugar ya elegido (o muy poco texto) no se busca.
    if (q.length < 3 || query === value?.label) return
    const controller = new AbortController()
    abortRef.current = controller
    const timer = setTimeout(async () => {
      setStatus("loading")
      try {
        const found = await searchPlaces(q, bias, controller.signal)
        setResults(found)
        setActive(-1)
        setStatus("idle")
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error")
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, bias, value?.label])

  function choose(place: PlaceResult) {
    setQuery(place.label)
    setOpen(false)
    onChange(place)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (event.key === "Enter" && open && results[active]) {
      event.preventDefault()
      choose(results[active])
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const searching = query.trim().length >= 3 && query !== value?.label
  const showList = open && searching
  const loading = status === "loading" && searching

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={placeholder ?? label}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-xl border border-input bg-card pr-10 pl-9 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              type="button"
              aria-label="Borrar"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery("")
                setResults([])
                onChange(null)
              }}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {status === "error" && (
            <li className="px-3 py-2 text-sm text-destructive">El buscador no responde. Inténtalo de nuevo.</li>
          )}
          {status !== "error" && results.length === 0 && !loading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>
          )}
          {results.map((place, i) => (
            <li
              key={place.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(place)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2",
                i === active && "bg-accent text-accent-foreground",
              )}
            >
              <p className="truncate text-sm font-medium">{place.title}</p>
              {place.subtitle && <p className="truncate text-xs text-muted-foreground">{place.subtitle}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
