"use client";

import { useId, useState } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export interface HistoryPoint {
  date: string;
  rawDate: string;
  prices: Record<string, number | null>;
}

interface PriceHistoryChartProps {
  history: HistoryPoint[];
  availableFuels: string[];
  fuelLabels: Record<string, { label: string; tag: string }>;
  days: number;
  onDaysChange: (days: number) => void;
  loading?: boolean;
}

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "60D", days: 60 },
  { label: "90D", days: 90 },
];

export function PriceHistoryChart({
  history,
  availableFuels,
  fuelLabels,
  days,
  onDaysChange,
  loading = false,
}: PriceHistoryChartProps) {
  const gradientId = useId();
  const [selectedFuel, setSelectedFuel] = useState<string>(
    availableFuels[0] || "gasolina95"
  );

  const series = history
    .map((item) => ({
      date: item.date,
      price: item.prices[selectedFuel],
    }))
    .filter((pt): pt is { date: string; price: number } => pt.price !== null && pt.price !== undefined && pt.price > 0);

  const prices = series.map((s) => s.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const firstPrice = prices.length > 0 ? prices[0] : 0;
  const lastPrice = prices.length > 0 ? prices[prices.length - 1] : 0;
  const diff = lastPrice - firstPrice;
  const diffPercent = firstPrice > 0 ? ((diff / firstPrice) * 100).toFixed(2) : "0.00";

  // SVG Chart dimensions
  const width = 650;
  const height = 220;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingTop - paddingBottom;
  const range = maxPrice === minPrice ? 0.01 : maxPrice - minPrice;

  // Generate SVG coordinates
  const points = series.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(series.length - 1, 1)) * chartW;
    const y = paddingTop + chartH - ((pt.price - minPrice) / range) * chartH;
    return { x, y, ...pt };
  });

  const pathD = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
    ""
  );

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} Z`
    : "";

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      {/* Top Header: Title, Time Range Selector & Fuel Selector */}
      <div className="flex flex-col gap-4 border-b border-border/50 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold">Evolución del Precio</h3>
            {series.length >= 2 && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-extrabold text-foreground">
                  {lastPrice.toFixed(3)} €/L
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    diff > 0
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : diff < 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {diff > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : diff < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : (
                    <Minus className="h-3.5 w-3.5" />
                  )}
                  {diff > 0 ? `+${diff.toFixed(3)} € (+${diffPercent}%)` : diff < 0 ? `${diff.toFixed(3)} € (${diffPercent}%)` : "Sin cambio"}
                </span>
              </div>
            )}
          </div>

          {/* Time range buttons */}
          <div className="flex items-center gap-1 bg-accent/60 p-1 rounded-xl border border-border/50 self-start sm:self-auto">
            {TIME_RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => onDaysChange(r.days)}
                disabled={loading}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  days === r.days
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Combustible select buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {availableFuels.map((fuelKey) => {
            const isSelected = selectedFuel === fuelKey;
            const meta = fuelLabels[fuelKey] || { tag: fuelKey };
            return (
              <button
                key={fuelKey}
                type="button"
                onClick={() => setSelectedFuel(fuelKey)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {meta.tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading or Chart render */}
      {loading ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Actualizando histórico...</span>
        </div>
      ) : series.length < 2 ? (
        <div className="flex min-h-[220px] items-center justify-center py-8 text-center">
          <p className="text-xs text-muted-foreground">
            No hay suficientes registros históricos disponibles para el periodo de {days} días seleccionado.
          </p>
        </div>
      ) : (
        <div className="mt-6 w-full overflow-x-auto">
          <div className="min-w-[500px]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id={`grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines horizontal */}
              {[0, 0.5, 1].map((ratio) => {
                const y = paddingTop + chartH * ratio;
                const val = maxPrice - ratio * (maxPrice - minPrice);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-muted-foreground text-[10px] font-mono"
                    >
                      {val.toFixed(3)}
                    </text>
                  </g>
                );
              })}

              {/* Area under curve */}
              <path d={areaD} fill={`url(#grad-${gradientId})`} />

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data points */}
              {points.map((pt, i) => {
                // Skip some X labels if points are too dense
                const showLabel = points.length <= 15 || i % Math.ceil(points.length / 10) === 0 || i === points.length - 1;

                return (
                  <g key={i} className="group cursor-pointer">
                    {/* Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={points.length > 20 ? "3" : "4"}
                      className="fill-card stroke-primary stroke-2 group-hover:r-6 transition-all"
                    />

                    {/* X axis Date label */}
                    {showLabel && (
                      <text
                        x={pt.x}
                        y={height - 8}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[9px] font-medium"
                      >
                        {pt.date}
                      </text>
                    )}

                    {/* Hover Tooltip inside SVG */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <rect
                        x={pt.x - 30}
                        y={pt.y - 32}
                        width="60"
                        height="22"
                        rx="6"
                        className="fill-foreground text-background"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 18}
                        textAnchor="middle"
                        className="fill-background text-[10px] font-black"
                      >
                        {pt.price.toFixed(3)} €
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
