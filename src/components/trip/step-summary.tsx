"use client"

import { Leaf } from "lucide-react"
import type { Dispatch } from "react"

import { formatCents, formatDuration, formatNumber } from "@/lib/format"
import type { TripResult } from "@/lib/trip/calculator"
import { FUEL_INFO } from "@/lib/trip/fuel"
import type { TripDraft } from "@/lib/trip/schema"

import { Field, TextInput } from "./fields"
import { unitLabel, type Action, type PlannerState } from "./state"

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${strong ? "text-base font-semibold" : "text-sm"}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

export function StepSummary({
  state,
  dispatch,
  draft,
  result,
}: {
  state: PlannerState
  dispatch: Dispatch<Action>
  draft: TripDraft
  result: TripResult
}) {
  const info = FUEL_INFO[draft.fuelType]
  const unit = unitLabel(draft.fuelType)
  const route = state.route

  return (
    <div className="space-y-5">
      <Field label="Título del viaje (opcional)">
        {({ id }) => (
          <TextInput id={id} value={state.title} maxLength={80} placeholder={`${state.origin?.title} → ${state.destination?.title}`}
            onChange={(e) => dispatch({ type: "title", value: e.target.value })} />
        )}
      </Field>

      <div className="rounded-xl bg-primary-soft p-4 text-center">
        <p className="text-sm text-muted-foreground">Total del viaje</p>
        <p className="font-heading text-4xl font-semibold tabular-nums">{formatCents(result.totalCents)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatNumber(result.totalKm)} km{route ? ` · ${formatDuration(route.durationMin * (draft.isRoundTrip ? 2 : 1))}` : ""}
          {draft.isRoundTrip ? " · ida y vuelta" : ""}
        </p>
      </div>

      <dl className="space-y-1.5">
        <Row label={`${info.label} (${formatNumber(result.energyUnits)} ${unit})`} value={formatCents(result.energyCents)} />
        {result.tollsCents > 0 && <Row label="Peajes" value={formatCents(result.tollsCents)} />}
        {draft.extras.map((e, i) => (
          <Row key={i} label={e.label} value={formatCents(Math.round(e.amount * 100))} />
        ))}
      </dl>

      <section aria-labelledby="who-h" className="space-y-2">
        <h3 id="who-h" className="text-sm font-semibold">Cada uno paga</h3>
        <ul className="divide-y rounded-xl border bg-card">
          {draft.passengers.map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="truncate text-sm">
                {p.name}
                {i === 0 && <span className="ml-1.5 text-xs text-muted-foreground">(conductor{!draft.driverPays ? ", invitado" : ""})</span>}
              </span>
              <span className="font-semibold tabular-nums">{formatCents(result.amountsCents[i])}</span>
            </li>
          ))}
        </ul>
        {result.driverReceivesCents > 0 && (
          <p className="text-xs text-muted-foreground">
            {draft.passengers[0].name} recibe {formatCents(result.driverReceivesCents)} del resto.
          </p>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Leaf className="size-4 text-success" />
        Emisiones estimadas: {formatNumber(result.co2Kg)} kg de CO₂
      </p>
    </div>
  )
}
