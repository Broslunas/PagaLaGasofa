"use client"

import { Car, Pencil, Plus, Star, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { CarSearch } from "@/components/trip/car-search"
import { DecimalInput, Field, TextInput } from "@/components/trip/fields"
import { Button } from "@/components/ui/button"
import { parseDecimal } from "@/lib/format"
import { FUEL_INFO, FUEL_TYPES, type FuelType } from "@/lib/trip/fuel"

interface VehicleView {
  id: string
  name: string | null
  brand: string
  model: string
  year: number | null
  fuelType: FuelType
  consumptionPer100km: number
  isDefault: boolean
}

interface Draft {
  id: string | null
  brand: string
  model: string
  year: string
  fuelType: FuelType
  consumption: string
  isDefault: boolean
}

const blank: Draft = { id: null, brand: "", model: "", year: "", fuelType: "gasolina95", consumption: "", isDefault: false }

export function VehiclesManager() {
  const [vehicles, setVehicles] = useState<VehicleView[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/vehicles", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        setVehicles(((await res.json()) as { vehicles: VehicleView[] }).vehicles)
      })
      .catch((e) => e.name !== "AbortError" && setError("No se pudieron cargar tus vehículos."))
    return () => controller.abort()
  }, [version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    const consumption = parseDecimal(draft.consumption)
    if (!(consumption > 0)) return setError("Indica el consumo.")
    setBusy(true)
    setError(null)
    const body = {
      brand: draft.brand.trim(),
      model: draft.model.trim(),
      year: draft.year.trim() ? Number(draft.year) : null,
      fuelType: draft.fuelType,
      consumptionPer100km: consumption,
      isDefault: draft.isDefault || undefined,
    }
    const res = await fetch(draft.id ? `/api/vehicles/${draft.id}` : "/api/vehicles", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null)
    setBusy(false)
    if (!res?.ok) return setError((await res?.json().catch(() => null))?.error ?? "No se pudo guardar el vehículo.")
    setDraft(null)
    reload()
  }

  async function makeDefault(id: string) {
    await fetch(`/api/vehicles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) })
    reload()
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este vehículo?")) return
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" })
    reload()
  }

  const unit = (f: FuelType) => (FUEL_INFO[f].unit === "kWh" ? "kWh" : "l")

  return (
    <div className="space-y-4">
      {vehicles === null && !error && <div className="h-24 animate-pulse rounded-2xl bg-muted" aria-busy="true" />}
      {vehicles?.length === 0 && !draft && (
        <div className="space-y-3 rounded-2xl border border-dashed p-8 text-center">
          <Car className="mx-auto size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Guarda tu coche una vez y úsalo en todos tus viajes.</p>
        </div>
      )}

      <ul className="space-y-2">
        {vehicles?.map((v) => (
          <li key={v.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <Car className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {v.brand} {v.model}{v.year ? ` (${v.year})` : ""}
                {v.isDefault && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-accent-foreground">Predeterminado</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {FUEL_INFO[v.fuelType].label} · {String(v.consumptionPer100km).replace(".", ",")} {unit(v.fuelType)}/100 km
              </p>
            </div>
            {!v.isDefault && <Button variant="ghost" size="icon-sm" aria-label={`Hacer predeterminado ${v.brand} ${v.model}`} onClick={() => makeDefault(v.id)}><Star /></Button>}
            <Button variant="ghost" size="icon-sm" aria-label={`Editar ${v.brand} ${v.model}`}
              onClick={() => setDraft({ id: v.id, brand: v.brand, model: v.model, year: v.year ? String(v.year) : "", fuelType: v.fuelType, consumption: String(v.consumptionPer100km).replace(".", ","), isDefault: v.isDefault })}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${v.brand} ${v.model}`} onClick={() => remove(v.id)}><Trash2 /></Button>
          </li>
        ))}
      </ul>

      {draft ? (
        <form onSubmit={save} className="space-y-3 rounded-2xl border bg-card p-4">
          <h2 className="font-semibold">{draft.id ? "Editar vehículo" : "Nuevo vehículo"}</h2>
          <CarSearch onPick={(car) => setDraft({ ...draft, brand: car.make, model: car.model, fuelType: car.fuelType, consumption: String(car.consumptionPer100km).replace(".", ",") })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca">{({ id }) => <TextInput id={id} required maxLength={40} value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />}</Field>
            <Field label="Modelo">{({ id }) => <TextInput id={id} required maxLength={60} value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} />}</Field>
            <Field label="Año (opcional)">{({ id }) => <TextInput id={id} inputMode="numeric" maxLength={4} value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value.replace(/\D/g, "") })} />}</Field>
            <Field label="Combustible">
              {({ id }) => (
                <select id={id} value={draft.fuelType} onChange={(e) => setDraft({ ...draft, fuelType: e.target.value as FuelType })} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-base">
                  {FUEL_TYPES.map((f) => <option key={f} value={f}>{FUEL_INFO[f].label}</option>)}
                </select>
              )}
            </Field>
          </div>
          <Field label="Consumo">
            {({ id }) => <DecimalInput id={id} value={draft.consumption} suffix={`${unit(draft.fuelType)}/100 km`} onChange={(v) => setDraft({ ...draft, consumption: v })} />}
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} className="size-4 accent-[var(--primary)]" />
            Usar como vehículo predeterminado
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !draft.brand.trim() || !draft.model.trim()}>Guardar</Button>
            <Button type="button" variant="ghost" onClick={() => { setDraft(null); setError(null) }}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setDraft(blank)}><Plus /> Añadir vehículo</Button>
      )}
      <p role="alert" className="min-h-4 text-sm text-destructive">{error}</p>
    </div>
  )
}
