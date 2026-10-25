"use client"

import { cn } from "@/lib/utils"

export interface Bar {
  /** `YYYY-MM` */
  month: string
  value: number
}

const W = 600
const H = 220
const PAD = { l: 8, r: 8, t: 14, b: 26 }
const monthFmt = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" })
const monthLabel = (m: string) => monthFmt.format(new Date(`${m}-01T00:00:00Z`)).replace(".", "")

/** Gráfico de barras mensual en SVG; la barra del mes actual va resaltada. */
export function BarChart({ bars, format, label }: { bars: Bar[]; format: (v: number) => string; label: string }) {
  const max = Math.max(...bars.map((b) => b.value), 0)
  const slot = (W - PAD.l - PAD.r) / bars.length
  const barW = Math.min(34, slot * 0.62)
  const y = (v: number) => PAD.t + (1 - (max === 0 ? 0 : v / max)) * (H - PAD.t - PAD.b)
  const last = bars.length - 1

  return (
    <figure className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="w-full">
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--border)" />
        {bars.map((b, i) => {
          const cx = PAD.l + slot * i + slot / 2
          const top = y(b.value)
          return (
            <g key={b.month}>
              <title>{`${monthLabel(b.month)}: ${format(b.value)}`}</title>
              {b.value > 0 && (
                <rect x={cx - barW / 2} y={top} width={barW} height={H - PAD.b - top} rx="5" fill={i === last ? "var(--primary)" : "var(--chart-1)"} opacity={i === last ? 1 : 0.55} />
              )}
              {b.value > 0 && max > 0 && b.value === max && (
                <text x={cx} y={top - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--foreground)">{format(b.value)}</text>
              )}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" className={cn(i === last && "font-semibold")}>{monthLabel(b.month)}</text>
            </g>
          )
        })}
      </svg>
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead><tr><th>Mes</th><th>Valor</th></tr></thead>
          <tbody>{bars.map((b) => <tr key={b.month}><td>{b.month}</td><td>{format(b.value)}</td></tr>)}</tbody>
        </table>
      </div>
    </figure>
  )
}
