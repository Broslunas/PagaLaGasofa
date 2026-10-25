"use client"

import { Plus, Save, X } from "lucide-react"
import Link from "next/link"
import { useState, type Dispatch } from "react"

import { Button } from "@/components/ui/button"
import { FUEL_INFO, FUEL_TYPES } from "@/lib/trip/fuel"
import { parseDecimal } from "@/lib/format"
import { cn } from "@/lib/utils"

import { CarSearch } from "./car-search"
import { DecimalInput, Field, TextInput } from "./fields"
import { formatDistance, formatPrice } from "@/lib/format"
import type { RouteStations } from "@/lib/stations/queries"
import { unitLabel, type Action, type PlannerState } from "./state"
import { useGarage } from "./use-garage"

export interface RouteStationsState {
  status: "idle" | "loading" | "ready" | "error"
  data: RouteStations | null
}

export function StepVehicle({
  state,
  dispatch,
  routeStations,
}: {
  state: PlannerState
  dispatch: Dispatch<Action>
  routeStations: RouteStationsState
}) {
  const garage = useGarage()
  const unit = unitLabel(state.fuelType)
  const consumptionSuffix = `${unit}/100 km`
  const priceSuffix = `€/${unit}`

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="vehicle-h">
        <h3 id="vehicle-h" className="text-sm font-semibold">
          Vehículo
        </h3>

        {garage.state.status === "ready" && garage.state.vehicles.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Mis vehículos">
            {garage.state.vehicles.map((v) => (
              <Button
                key={v.id}
                type="button"
                size="sm"
                variant={state.vehicleLabel === (v.name || `${v.brand} ${v.model}`) ? "default" : "outline"}
                onClick={() =>
                  dispatch({
                    type: "vehicle",
                    label: v.name || `${v.brand} ${v.model}`,
                    meta: { brand: v.brand, model: v.model },
                    fuelType: v.fuelType,
                    consumption: v.consumptionPer100km,
                  })
                }
              >
                {v.name || `${v.brand} ${v.model}`}
              </Button>
            ))}
          </div>
        )}
        {garage.state.status === "anonymous" && (
          <p className="text-xs text-muted-foreground">
            <Link href="/login?next=/viaje" className="underline underline-offset-2">
              Inicia sesión
            </Link>{" "}
            para guardar tus coches y reutilizarlos.
          </p>
        )}

        <CarSearch
          onPick={(car) =>
            dispatch({
              type: "vehicle",
              label: `${car.make} ${car.model}`,
              meta: { brand: car.make, model: car.model },
              fuelType: car.fuelType,
              consumption: car.consumptionPer100km,
            })
          }
        />

        <Field label="Combustible">
          {({ id }) => (
            <div id={id} role="radiogroup" aria-label="Combustible" className="flex flex-wrap gap-2">
              {FUEL_TYPES.map((fuel) => (
                <button
                  key={fuel}
                  type="button"
                  role="radio"
                  aria-checked={state.fuelType === fuel}
                  onClick={() => dispatch({ type: "fuel", fuelType: fuel })}
                  className={cn(
                    "h-9 rounded-full border px-3 text-sm transition-colors",
                    state.fuelType === fuel
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card hover:bg-accent",
                  )}
                >
                  {FUEL_INFO[fuel].label}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field
          label="Consumo"
          hint={state.vehicleLabel ? `${state.vehicleLabel} · consumo oficial (WLTP). Puedes ajustarlo.` : "Mira el ordenador de a bordo para un dato más real."}
        >
          {({ id, describedBy }) => (
            <DecimalInput id={id} describedBy={describedBy} value={state.consumption} suffix={consumptionSuffix}
              placeholder={unit === "l" ? "6,0" : "16,0"}
              onChange={(value) => dispatch({ type: "consumption", value })} />
          )}
        </Field>

        {garage.state.status === "ready" && (
          <SaveVehicle state={state} onSaved={garage.reload} />
        )}
      </section>

      <section className="space-y-3" aria-labelledby="cost-h">
        <h3 id="cost-h" className="text-sm font-semibold">
          Costes
        </h3>
        <Field label={`Precio del ${unit === "l" ? "combustible" : "kWh"}`}>
          {({ id }) => (
            <DecimalInput id={id} value={state.price} suffix={priceSuffix} placeholder={unit === "l" ? "1,45" : "0,25"}
              onChange={(value) => dispatch({ type: "price", value })} />
          )}
        </Field>
        <RouteStationsPanel state={state} routeStations={routeStations} onUse={(p) => dispatch({ type: "price", value: formatPrice(p) })} />
        <Field label="Peajes (total)" hint="Suma de todos los peajes del viaje, si los hay.">
          {({ id, describedBy }) => (
            <DecimalInput id={id} describedBy={describedBy} value={state.tolls} suffix="€" placeholder="0"
              onChange={(value) => dispatch({ type: "tolls", value })} />
          )}
        </Field>

        <div className="space-y-2">
          <p className="text-sm font-medium">Otros gastos</p>
          {state.extras.map((extra) => (
            <div key={extra.id} className="flex items-center gap-2">
              <TextInput
                aria-label="Concepto"
                placeholder="Parking, ferry…"
                maxLength={40}
                value={extra.label}
                onChange={(e) => dispatch({ type: "extra-set", id: extra.id, patch: { label: e.target.value } })}
              />
              <DecimalInput className="w-32 shrink-0" value={extra.amount} suffix="€"
                onChange={(value) => dispatch({ type: "extra-set", id: extra.id, patch: { amount: value } })} />
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar gasto"
                onClick={() => dispatch({ type: "extra-remove", id: extra.id })}>
                <X />
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => dispatch({ type: "extra-add" })}>
            <Plus /> Añadir gasto
          </Button>
        </div>
      </section>
    </div>
  )
}

/** Guarda el vehículo actual en el garaje (solo con sesión). */
function SaveVehicle({ state, onSaved }: { state: PlannerState; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const consumption = parseDecimal(state.consumption)
  if (!(consumption > 0)) return null
  if (status === "saved") return <p className="text-xs text-success">Guardado en tu garaje.</p>

  async function save() {
    setStatus("saving")
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: (state.vehicleMeta?.brand ?? brand).trim(),
        model: (state.vehicleMeta?.model ?? model).trim(),
        fuelType: state.fuelType,
        consumptionPer100km: consumption,
      }),
    }).catch(() => null)
    if (res?.ok) {
      setStatus("saved")
      onSaved()
    } else setStatus("error")
  }

  const needsNames = !state.vehicleMeta

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => (needsNames ? setOpen(true) : save())}>
        <Save /> Guardar en mi garaje
      </Button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border bg-card p-3">
      <div className="grid grid-cols-2 gap-2">
        <TextInput aria-label="Marca" placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={40} />
        <TextInput aria-label="Modelo" placeholder="Modelo" value={model} onChange={(e) => setModel(e.target.value)} maxLength={60} />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={!brand.trim() || !model.trim() || status === "saving"} onClick={save}>
          Guardar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        {status === "error" && <span role="alert" className="text-xs text-destructive">No se pudo guardar.</span>}
      </div>
    </div>
  )
}

function RouteStationsPanel({ state, routeStations, onUse }: { state: PlannerState; routeStations: RouteStationsState; onUse: (price: number) => void }) {
  if (state.fuelType === "electrico" || !state.route) return null
  const { status, data } = routeStations
  const current = parseDecimal(state.price)

  return (
    <section aria-labelledby="route-stations-h" className="space-y-2 rounded-xl border bg-card p-3">
      <h4 id="route-stations-h" className="text-sm font-medium">Gasolineras en tu ruta</h4>
      {status === "loading" && <p className="text-xs text-muted-foreground">Buscando gasolineras a menos de 3 km de la ruta…</p>}
      {status === "error" && <p className="text-xs text-destructive">No se pudieron cargar los precios de la ruta.</p>}
      {status === "ready" && data && data.stats.count === 0 && (
        <p className="text-xs text-muted-foreground">No hay gasolineras con este combustible cerca de la ruta.</p>
      )}
      {status === "ready" && data && data.stats.count > 0 && (
        <>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {data.stats.count} gasolineras · media <strong className="text-foreground">{formatPrice(data.stats.avg!)}</strong> €/l
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => onUse(data.stats.avg!)}>
              Usar la media
            </Button>
          </div>
          <ul className="divide-y">
            {data.stations.slice(0, 4).map((s) => {
              const price = s.prices[state.fuelType as keyof typeof s.prices] as number
              return (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{s.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.locality} · a {formatDistance(s.distanceKm ?? 0)} de la ruta
                    </span>
                  </span>
                  <Button type="button" size="sm" variant={Math.abs(current - price) < 0.0005 ? "default" : "outline"} onClick={() => onUse(price)}>
                    {formatPrice(price)} €
                  </Button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
