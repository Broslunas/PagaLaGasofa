// Interpreta el campo «Horario» de MITECO: «L-V: 06:00-22:00; S-D: 07:00-22:00»,
// «L-D: 24H», «L-V: 07:00-15:00 y 17:00-22:00».
// Si algo no encaja se trata como «horario desconocido», nunca como error.

const DAYS = ["L", "M", "X", "J", "V", "S", "D"] as const
type Day = (typeof DAYS)[number]

interface Range {
  start: number // minutos desde medianoche
  end: number // > 1440 si cruza la medianoche
}

type Week = Record<Day, Range[]>

const emptyWeek = (): Week => ({ L: [], M: [], X: [], J: [], V: [], S: [], D: [] })

function expandDays(token: string): Day[] | null {
  const [from, to] = token.split("-").map((t) => t.trim())
  const i = DAYS.indexOf(from as Day)
  if (i === -1) return null
  if (!to) return [DAYS[i]]
  const j = DAYS.indexOf(to as Day)
  if (j === -1) return null
  const out: Day[] = []
  for (let k = i; ; k = (k + 1) % 7) {
    out.push(DAYS[k])
    if (k === j) break
  }
  return out
}

const toMinutes = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

export function parseSchedule(schedule: string): Week | null {
  if (!schedule.trim()) return null
  const week = emptyWeek()
  let any = false
  for (const segment of schedule.split(";")) {
    const idx = segment.indexOf(":")
    if (idx === -1) continue
    const days = expandDays(segment.slice(0, idx).trim())
    if (!days) continue
    const times = segment.slice(idx + 1).trim()
    const ranges: Range[] = []
    if (times === "24H") ranges.push({ start: 0, end: 1440 })
    else {
      for (const part of times.split(" y ")) {
        const [a, b] = part.split("-")
        const start = a === undefined ? null : toMinutes(a)
        const end = b === undefined ? null : toMinutes(b)
        if (start === null || end === null) continue
        ranges.push({ start, end: end <= start ? end + 1440 : end })
      }
    }
    if (ranges.length === 0) continue
    any = true
    for (const d of days) week[d].push(...ranges)
  }
  return any ? week : null
}

/** Canarias usa otra zona horaria que la península. */
export const timeZoneFor = (lat: number) => (lat < 30 ? "Atlantic/Canary" : "Europe/Madrid")

function localParts(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  const day = ({ Mon: "L", Tue: "M", Wed: "X", Thu: "J", Fri: "V", Sat: "S", Sun: "D" } as Record<string, Day>)[get("weekday")]
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) }
}

export const is24h = (schedule: string) => {
  const week = parseSchedule(schedule)
  return Boolean(week && DAYS.every((d) => week[d].some((r) => r.start === 0 && r.end >= 1440)))
}

export interface OpenStatus {
  /** `null` si el horario no se entiende. */
  open: boolean | null
  /** Texto corto para la interfaz. */
  label: string
}

const hhmm = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`

export function openStatus(schedule: string, now: Date, timeZone = "Europe/Madrid"): OpenStatus {
  const week = parseSchedule(schedule)
  if (!week) return { open: null, label: "Horario no disponible" }
  if (is24h(schedule)) return { open: true, label: "Abierto 24 h" }

  const { day, minutes } = localParts(now, timeZone)
  const idx = DAYS.indexOf(day)
  const yesterday = DAYS[(idx + 6) % 7]

  // Abierto ahora: tramo de hoy, o tramo de ayer que cruza la medianoche.
  for (const r of week[day]) {
    if (minutes >= r.start && minutes < r.end) return { open: true, label: `Abierto · cierra a las ${hhmm(r.end)}` }
  }
  for (const r of week[yesterday]) {
    if (r.end > 1440 && minutes < r.end - 1440) return { open: true, label: `Abierto · cierra a las ${hhmm(r.end)}` }
  }

  // Cerrado: próxima apertura (hoy o en los próximos días).
  for (let offset = 0; offset < 7; offset++) {
    const d = DAYS[(idx + offset) % 7]
    const next = week[d].map((r) => r.start).filter((s) => offset > 0 || s > minutes).sort((a, b) => a - b)[0]
    if (next !== undefined) {
      const when = offset === 0 ? "" : offset === 1 ? " mañana" : ` el ${({ L: "lunes", M: "martes", X: "miércoles", J: "jueves", V: "viernes", S: "sábado", D: "domingo" } as Record<Day, string>)[d]}`
      return { open: false, label: `Cerrado · abre${when} a las ${hhmm(next)}` }
    }
  }
  return { open: false, label: "Cerrado" }
}
