"use client"

import { Plus, X } from "lucide-react"
import type { Dispatch } from "react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { formatCents, formatDecimal2, parseDecimal } from "@/lib/format"
import type { TripResult } from "@/lib/trip/calculator"
import { LIMITS } from "@/lib/trip/schema"
import { cn } from "@/lib/utils"

import { DecimalInput, TextInput } from "./fields"
import { equalPercents, stopPlaces, type Action, type PlannerState, type SplitModeId } from "./state"

const MODES: { id: SplitModeId; label: string; hint: string }[] = [
  { id: "legs", label: "Por tramos", hint: "Cada uno paga solo los tramos en los que va a bordo." },
  { id: "equal", label: "A partes iguales", hint: "El total entre todos los que pagan." },
  { id: "percent", label: "Porcentajes", hint: "Tú decides qué parte del total paga cada uno." },
  { id: "manual", label: "Importes", hint: "Escribe cuánto paga cada uno." },
]

export function StepPassengers({
  state,
  dispatch,
  result,
}: {
  state: PlannerState
  dispatch: Dispatch<Action>
  result: TripResult | null
}) {
  const places = stopPlaces(state)
  const legs = state.waypoints.length + 1
  const showStops = legs > 1
  const mode = MODES.find((m) => m.id === state.splitMode)!

  function changeMode(id: SplitModeId) {
    let prefill: string[] | undefined
    if (id === "percent") prefill = equalPercents(state.passengers.length)
    if (id === "manual") {
      prefill = state.passengers.map((_, i) => (result ? formatDecimal2(result.amountsCents[i] / 100).replace(/\./g, "") : ""))
    }
    dispatch({ type: "split-mode", mode: id, prefill })
  }

  const stopLabel = (i: number) => places[i]?.title ?? `Parada ${i}`
  const percentSum = state.passengers.reduce((s, p) => s + (parseDecimal(p.value) || 0), 0)
  const unit = state.splitMode === "percent" ? "%" : "€"

  return (
    <div className="space-y-5">
      <ul className="space-y-3">
        {state.passengers.map((p, i) => (
          <li key={p.id} className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <TextInput
                aria-label={i === 0 ? "Nombre del conductor" : `Nombre del pasajero ${i}`}
                value={p.name}
                maxLength={40}
                onChange={(e) => dispatch({ type: "passenger-set", id: p.id, patch: { name: e.target.value } })}
              />
              {state.splitMode === "percent" || state.splitMode === "manual" ? (
                <DecimalInput className="w-28 shrink-0" value={p.value} suffix={unit}
                  onChange={(value) => dispatch({ type: "passenger-set", id: p.id, patch: { value } })} />
              ) : (
                result && (
                  <span className="w-24 shrink-0 text-right text-base font-semibold tabular-nums">
                    {formatCents(result.amountsCents[i] ?? 0)}
                  </span>
                )
              )}
              {i > 0 && (
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Quitar a ${p.name || "pasajero"}`}
                  onClick={() => dispatch({ type: "passenger-remove", id: p.id })}>
                  <X />
                </Button>
              )}
            </div>

            {i === 0 && (
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Conductor
                  <span className="block text-xs text-muted-foreground">
                    {state.driverPays ? "Paga su parte como los demás" : "Va invitado: el resto cubre todo"}
                  </span>
                </span>
                <Switch checked={state.driverPays} onCheckedChange={(value) => dispatch({ type: "driver-pays", value })}
                  aria-label="El conductor paga su parte" />
              </label>
            )}

            {i > 0 && showStops && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">Sube en</span>
                  <select
                    className="h-10 w-full rounded-lg border border-input bg-card px-2 text-base"
                    value={Math.min(p.pickup, legs - 1)}
                    onChange={(e) => {
                      const pickup = Number(e.target.value)
                      dispatch({
                        type: "passenger-set",
                        id: p.id,
                        patch: { pickup, dropoff: p.dropoff !== null && p.dropoff <= pickup ? null : p.dropoff },
                      })
                    }}
                  >
                    {places.slice(0, legs).map((_, s) => (
                      <option key={s} value={s}>{stopLabel(s)}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">Baja en</span>
                  <select
                    className="h-10 w-full rounded-lg border border-input bg-card px-2 text-base"
                    value={p.dropoff ?? legs}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      dispatch({ type: "passenger-set", id: p.id, patch: { dropoff: v === legs ? null : v } })
                    }}
                  >
                    {places.map((_, s) => s > Math.min(p.pickup, legs - 1) && (
                      <option key={s} value={s}>{stopLabel(s)}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>

      {state.passengers.length < LIMITS.passengers.max && (
        <Button type="button" variant="outline" onClick={() => dispatch({ type: "passenger-add" })}>
          <Plus /> Añadir pasajero
        </Button>
      )}

      <section className="space-y-2" aria-labelledby="split-h">
        <h3 id="split-h" className="text-sm font-semibold">¿Cómo se reparte?</h3>
        <div role="radiogroup" aria-labelledby="split-h" className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={state.splitMode === m.id}
              onClick={() => changeMode(m.id)}
              className={cn(
                "h-10 rounded-xl border px-3 text-sm transition-colors",
                state.splitMode === m.id ? "border-primary bg-primary-soft font-medium text-accent-foreground" : "bg-card hover:bg-accent",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{mode.hint}</p>
        {state.splitMode === "percent" && (
          <p className={cn("text-xs", Math.abs(percentSum - 100) > 0.01 ? "text-destructive" : "text-success")} aria-live="polite">
            Suma: {formatDecimal2(percentSum)} % {Math.abs(percentSum - 100) > 0.01 && "(debe ser 100 %)"}
          </p>
        )}
        {state.splitMode === "manual" && result && (
          <p className={cn("text-xs", result.balanceCents !== 0 ? "text-destructive" : "text-success")} aria-live="polite">
            {result.balanceCents === 0
              ? "Los importes cubren el total."
              : result.balanceCents > 0
                ? `Faltan ${formatCents(result.balanceCents)} por asignar.`
                : `Te pasas ${formatCents(-result.balanceCents)} del total.`}
          </p>
        )}
      </section>
    </div>
  )
}
