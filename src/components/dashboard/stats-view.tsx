"use client"

import { Download, TrendingDown, TrendingUp } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import type { MonthRow } from "@/lib/dashboard/series"
import { formatCents, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

import { BarChart } from "./bar-chart"
import { StatCard } from "./stat-card"

const METRICS = {
  spend: { label: "Gasto", value: (m: MonthRow) => m.spendCents / 100, format: (v: number) => formatCents(Math.round(v * 100)) },
  km: { label: "Kilómetros", value: (m: MonthRow) => m.km, format: (v: number) => `${formatNumber(v)} km` },
  co2: { label: "CO₂", value: (m: MonthRow) => m.co2Kg, format: (v: number) => `${formatNumber(v)} kg` },
  trips: { label: "Viajes", value: (m: MonthRow) => m.trips, format: (v: number) => String(v) },
} as const
type MetricKey = keyof typeof METRICS

function delta(cur: number, prev: number) {
  if (prev === 0) return cur === 0 ? 0 : null
  return ((cur - prev) / prev) * 100
}

export function StatsView({ months, year }: { months: MonthRow[]; year: number }) {
  const [metric, setMetric] = useState<MetricKey>("spend")
  const m = METRICS[metric]
  const bars = useMemo(() => months.map((x) => ({ month: x.month, value: m.value(x) })), [months, m])

  const cur = months[months.length - 1]
  const prev = months[months.length - 2]
  const total = months.reduce((s, x) => s + x.spendCents, 0)
  const savings = months.reduce((s, x) => s + x.savingsCents, 0)
  const d = prev ? delta(m.value(cur), m.value(prev)) : null

  return (
    <div className="space-y-6">
      <section aria-label="Cifras del año" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Este mes" value={m.format(m.value(cur))} hint={d === null ? "Sin mes anterior con datos" : `${d > 0 ? "+" : ""}${Math.round(d)} % frente al mes pasado`} />
        <StatCard label="Últimos 12 meses" value={formatCents(total)} hint={`${months.reduce((s, x) => s + x.trips, 0)} viajes`} />
        <StatCard label="Ahorro estimado" value={formatCents(savings)} tone={savings > 0 ? "success" : "default"} hint="Frente a repostar al precio más alto de tu ruta" />
        <StatCard label="CO₂ emitido" value={`${formatNumber(months.reduce((s, x) => s + x.co2Kg, 0))} kg`} hint="Estimación a partir del consumo" />
      </section>

      <section aria-labelledby="chart-h" className="space-y-3 rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="chart-h" className="text-lg font-semibold">Evolución mensual</h2>
          <div role="radiogroup" aria-label="Métrica" className="flex rounded-full border bg-background p-0.5 text-sm">
            {(Object.keys(METRICS) as MetricKey[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={metric === k} onClick={() => setMetric(k)}
                className={cn("h-8 rounded-full px-3 transition-colors", metric === k ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                {METRICS[k].label}
              </button>
            ))}
          </div>
        </div>
        {d !== null && Math.abs(d) >= 1 && (
          <p className={cn("flex items-center gap-1.5 text-sm", metric === "trips" ? "text-muted-foreground" : d > 0 ? "text-destructive" : "text-success")}>
            {d > 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            {m.label} este mes: {d > 0 ? "+" : ""}{Math.round(d)} % respecto al mes anterior
          </p>
        )}
        <BarChart bars={bars} format={m.format} label={`${m.label} por mes, últimos 12 meses`} />
      </section>

      <section aria-labelledby="export-h" className="space-y-3 rounded-2xl border bg-card p-4">
        <h2 id="export-h" className="text-lg font-semibold">Exportar</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href="/api/export/trips" download><Download /> Viajes (CSV para Excel)</a></Button>
          <Button asChild variant="outline"><a href={`/api/export/report?year=${year}`} download><Download /> Informe de {year} (PDF)</a></Button>
        </div>
      </section>
    </div>
  )
}
