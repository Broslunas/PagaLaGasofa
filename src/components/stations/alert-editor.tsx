"use client"

import { BellRing } from "lucide-react"
import { useState } from "react"

import { DecimalInput } from "@/components/trip/fields"
import { Switch } from "@/components/ui/switch"
import { formatPrice, parseDecimal } from "@/lib/format"
import { STATION_FUELS, type StationFuel } from "@/lib/stations/types"
import { FUEL_INFO } from "@/lib/trip/fuel"

interface Props {
  stationId: string
  fuel: StationFuel
  currentPrice: number | null
  initialEnabled: boolean
  initialThreshold: number | null
  availableFuels: StationFuel[]
}

async function patch(body: Record<string, unknown>) {
  const res = await fetch("/api/favorites", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
  return Boolean(res?.ok)
}

/** Alerta de precio de una favorita: combustible vigilado, avisar de bajadas y precio objetivo opcional. */
export function AlertEditor({ stationId, fuel: initialFuel, currentPrice, initialEnabled, initialThreshold, availableFuels }: Props) {
  const [fuel, setFuel] = useState(initialFuel)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [threshold, setThreshold] = useState(initialThreshold === null ? "" : formatPrice(initialThreshold))
  const [error, setError] = useState<string | null>(null)

  async function save(body: Record<string, unknown>, revert: () => void) {
    setError(null)
    if (!(await patch({ stationId, ...body }))) {
      revert()
      setError("No se pudo guardar")
    }
  }

  function commitThreshold() {
    const value = threshold.trim() === "" ? null : parseDecimal(threshold)
    if (value !== null && !(value >= 0.3 && value <= 4)) return setError("Precio no válido")
    void save({ alertThreshold: value }, () => setThreshold(initialThreshold === null ? "" : formatPrice(initialThreshold)))
  }

  return (
    <div className="space-y-3 border-t px-3 py-3">
      <label className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <BellRing className="size-4" /> Avisarme si baja el precio
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={(value) => {
            setEnabled(value)
            void save({ alertEnabled: value }, () => setEnabled(!value))
          }}
          aria-label="Activar alerta de precio"
        />
      </label>

      {enabled && (
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Combustible</span>
            <select
              value={fuel}
              onChange={(e) => {
                const next = e.target.value as StationFuel
                const prev = fuel
                setFuel(next)
                void save({ fuelType: next }, () => setFuel(prev))
              }}
              className="h-10 w-full rounded-xl border border-input bg-card px-2 text-base"
            >
              {STATION_FUELS.filter((f) => availableFuels.includes(f)).map((f) => (
                <option key={f} value={f}>{FUEL_INFO[f].label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Precio objetivo (opcional)</span>
            <DecimalInput
              value={threshold}
              suffix="€/l"
              placeholder={currentPrice === null ? "1,600" : formatPrice(currentPrice - 0.05)}
              onChange={setThreshold}
              className="[&_input]:h-10"
            />
          </label>
          <p className="col-span-2 text-xs text-muted-foreground">
            {threshold.trim() === ""
              ? "Te avisaremos de cualquier bajada de 1 céntimo o más."
              : "Te avisaremos cuando el precio baje hasta ese valor o por debajo."}{" "}
            <button type="button" onClick={commitThreshold} className="underline underline-offset-2">Guardar objetivo</button>
          </p>
        </div>
      )}
      <p role="alert" className="min-h-4 text-xs text-destructive">{error}</p>
    </div>
  )
}
