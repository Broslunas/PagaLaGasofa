"use client"

import { FUEL_INFO } from "@/lib/trip/fuel"
import { STATION_FUELS, type StationFuel } from "@/lib/stations/types"
import { cn } from "@/lib/utils"

export function FuelChips({
  value,
  onChange,
  available,
}: {
  value: StationFuel
  onChange: (fuel: StationFuel) => void
  /** Si se indica, solo se muestran estos combustibles. */
  available?: readonly StationFuel[]
}) {
  const fuels = available ?? STATION_FUELS
  return (
    <div role="radiogroup" aria-label="Combustible" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {fuels.map((fuel) => (
        <button
          key={fuel}
          type="button"
          role="radio"
          aria-checked={value === fuel}
          onClick={() => onChange(fuel)}
          className={cn(
            "h-9 shrink-0 rounded-full border px-3 text-sm transition-colors",
            value === fuel ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
          )}
        >
          {FUEL_INFO[fuel].label}
        </button>
      ))}
    </div>
  )
}
