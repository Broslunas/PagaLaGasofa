"use client"

import { useEffect, useId, useMemo, useState } from "react"

import { formatPrice } from "@/lib/format"
import { FUEL_INFO } from "@/lib/trip/fuel"
import type { StationFuel } from "@/lib/stations/types"
import { cn } from "@/lib/utils"

import { FuelChips } from "./fuel-chips"

interface Point {
  day: string
  price: number
}

const RANGES = [7, 30, 90] as const
const W = 600
const H = 220
const PAD = { l: 48, r: 14, t: 14, b: 28 }

const dayMs = (day: string) => Date.parse(`${day}T00:00:00Z`)
const dayLabel = (day: string) => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }).format(dayMs(day))

export function PriceChart({ stationId, fuels, initialFuel }: { stationId: string; fuels: StationFuel[]; initialFuel: StationFuel }) {
  const [fuel, setFuel] = useState(initialFuel)
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [points, setPoints] = useState<Point[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [hover, setHover] = useState<number | null>(null)
  const gradientId = useId()

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/stations/${stationId}/history?fuel=${fuel}&days=${days}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        setPoints(((await res.json()) as { points: Point[] }).points)
        setStatus("ready")
      })
      .catch((e) => e.name !== "AbortError" && setStatus("error"))
    return () => controller.abort()
  }, [stationId, fuel, days])

  const chart = useMemo(() => {
    if (points.length < 2) return null
    const prices = points.map((p) => p.price)
    const lo = Math.min(...prices)
    const hi = Math.max(...prices)
    const span = Math.max(hi - lo, 0.02)
    const min = lo - span * 0.15
    const max = hi + span * 0.15
    const t0 = dayMs(points[0].day)
    const t1 = dayMs(points[points.length - 1].day)
    const x = (day: string) => PAD.l + ((dayMs(day) - t0) / Math.max(t1 - t0, 1)) * (W - PAD.l - PAD.r)
    const y = (price: number) => PAD.t + (1 - (price - min) / (max - min)) * (H - PAD.t - PAD.b)
    const coords = points.map((p) => [x(p.day), y(p.price)] as const)
    const line = coords.map(([cx, cy], i) => `${i ? "L" : "M"}${cx.toFixed(1)},${cy.toFixed(1)}`).join(" ")
    const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${H - PAD.b} L${coords[0][0].toFixed(1)},${H - PAD.b} Z`
    const ticks = [0, 1, 2, 3].map((i) => min + ((max - min) * i) / 3)
    return { coords, line, area, ticks, y, lo, hi, first: points[0], last: points[points.length - 1] }
  }, [points])

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!chart) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    chart.coords.forEach(([cx], i) => {
      if (Math.abs(cx - px) < Math.abs(chart.coords[best][0] - px)) best = i
    })
    setHover(best)
  }

  const shown = hover !== null && chart ? points[hover] : null
  const change = chart ? chart.last.price - chart.first.price : 0

  return (
    <section aria-labelledby="chart-h" className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="chart-h" className="text-lg font-semibold">Evolución del precio</h2>
        <div role="radiogroup" aria-label="Periodo" className="flex rounded-full border bg-background p-0.5 text-sm">
          {RANGES.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={days === r} onClick={() => setDays(r)}
              className={cn("h-8 rounded-full px-3 transition-colors", days === r ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {r} días
            </button>
          ))}
        </div>
      </div>
      {fuels.length > 1 && <FuelChips value={fuel} onChange={(f) => { setFuel(f); setStatus("loading") }} available={fuels} />}

      {status === "error" && <p role="alert" className="text-sm text-destructive">No se pudo cargar el histórico.</p>}
      {status === "loading" && <div className="h-56 animate-pulse rounded-xl bg-muted" aria-busy="true" />}
      {status === "ready" && !chart && (
        <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Todavía no hay suficientes días de histórico para este combustible: empezamos a guardarlo hace poco. Vuelve en unos días.
        </p>
      )}

      {status === "ready" && chart && (
        <>
          <div className="flex items-baseline justify-between text-sm">
            <p>
              <span className="text-2xl font-semibold tabular-nums">{formatPrice((shown ?? chart.last).price)}</span>{" "}
              <span className="text-muted-foreground">€/l · {dayLabel((shown ?? chart.last).day)}</span>
            </p>
            <p className={cn("tabular-nums", change > 0.0005 ? "text-destructive" : change < -0.0005 ? "text-success" : "text-muted-foreground")}>
              {change > 0 ? "+" : ""}{formatPrice(change)} € en {days} días
            </p>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Precio de ${FUEL_INFO[fuel].label}: de ${formatPrice(chart.first.price)} a ${formatPrice(chart.last.price)} euros por litro en ${days} días`}
            className="w-full touch-pan-y select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {chart.ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={chart.y(t)} y2={chart.y(t)} stroke="var(--border)" strokeWidth="1" />
                <text x={PAD.l - 8} y={chart.y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">{formatPrice(t)}</text>
              </g>
            ))}
            <text x={PAD.l} y={H - 8} fontSize="11" fill="var(--muted-foreground)">{dayLabel(chart.first.day)}</text>
            <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">{dayLabel(chart.last.day)}</text>
            <path d={chart.area} fill={`url(#${gradientId})`} />
            <path d={chart.line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && (
              <g>
                <line x1={chart.coords[hover][0]} x2={chart.coords[hover][0]} y1={PAD.t} y2={H - PAD.b} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                <circle cx={chart.coords[hover][0]} cy={chart.coords[hover][1]} r="5" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
              </g>
            )}
            {hover === null && <circle cx={chart.coords[chart.coords.length - 1][0]} cy={chart.coords[chart.coords.length - 1][1]} r="5" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />}
          </svg>
          <p className="text-xs text-muted-foreground">
            Mínimo {formatPrice(chart.lo)} € · máximo {formatPrice(chart.hi)} € en el periodo.
          </p>
          <div className="sr-only">
            <table>
              <caption>Precios diarios de {FUEL_INFO[fuel].label}</caption>
              <thead><tr><th>Día</th><th>€/l</th></tr></thead>
              <tbody>{points.map((p) => <tr key={p.day}><td>{p.day}</td><td>{formatPrice(p.price)}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
