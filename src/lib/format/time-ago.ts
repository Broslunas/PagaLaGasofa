const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
]

/** «hace 5 minutos», «ayer», «hace 3 días». */
export function timeAgo(date: Date | string, now = new Date()): string {
  const diff = new Date(date).getTime() - now.getTime()
  if (Math.abs(diff) < 60_000) return "ahora mismo"
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit)
  }
  return "ahora mismo"
}
