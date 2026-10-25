"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { formatCents, formatNumber } from "@/lib/format"
import { calculateTrip } from "@/lib/trip/calculator"
import { cn } from "@/lib/utils"

function Slider({ id, label, value, min, max, step, unit, onChange, display }: {
  id: string; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; display?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-lg font-medium">{label}</label>
        <output htmlFor={id} className="font-heading text-2xl font-semibold tabular-nums">
          {display ?? formatNumber(value)} <span className="text-base font-normal text-muted-foreground">{unit}</span>
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-10 w-full cursor-pointer accent-[var(--primary)]"
      />
    </div>
  )
}

/** El reparto de verdad, con los números del visitante. Usa la misma calculadora que la app. */
export function LiveCalculator() {
  const [km, setKm] = useState(350)
  const [consumption, setConsumption] = useState(6)
  const [price, setPrice] = useState(1.55)
  const [people, setPeople] = useState(4)
  const [roundTrip, setRoundTrip] = useState(false)

  const result = useMemo(
    () =>
      calculateTrip({
        legsKm: [km],
        isRoundTrip: roundTrip,
        fuelType: "gasolina95",
        consumptionPer100km: consumption,
        pricePerUnit: price,
        tolls: 0,
        extras: [],
        passengers: Array.from({ length: people }, () => ({ pickupStop: 0, dropoffStop: 1 })),
        driverPays: true,
        split: { mode: "equal" },
      }),
    [km, consumption, price, people, roundTrip],
  )

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div className="space-y-7">
        <Slider id="lc-km" label="Distancia" value={km} min={20} max={1500} step={10} unit="km" onChange={setKm} />
        <Slider id="lc-cons" label="Consumo" value={consumption} min={3} max={12} step={0.1} unit="l/100 km" display={consumption.toFixed(1).replace(".", ",")} onChange={setConsumption} />
        <Slider id="lc-price" label="Precio" value={price} min={1.2} max={2.2} step={0.01} unit="€/l" display={price.toFixed(2).replace(".", ",")} onChange={setPrice} />
        <Slider id="lc-people" label="Personas" value={people} min={1} max={8} step={1} unit={people === 1 ? "persona" : "personas"} onChange={setPeople} />
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 text-lg font-medium">
          Ida y vuelta
          <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="size-6 accent-[var(--primary)]" />
        </label>
      </div>

      <div className="rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10" aria-live="polite">
        <p className="text-lg opacity-90">{people === 1 ? "El viaje te cuesta" : "Cada uno paga"}</p>
        <p className="font-heading text-[clamp(3.5rem,13vw,6.5rem)] leading-none font-semibold tabular-nums">{formatCents(result.amountsCents[0])}</p>
        <p className="mt-3 opacity-90">
          {formatCents(result.totalCents)} en total · {formatNumber(result.energyUnits)} litros{roundTrip ? " · ida y vuelta" : ""}
        </p>
        <Button asChild size="lg" variant="secondary" className={cn("mt-8 h-12 px-6 text-base")}>
          <Link href="/viaje">Hazlo con tu ruta real</Link>
        </Button>
      </div>
    </div>
  )
}
