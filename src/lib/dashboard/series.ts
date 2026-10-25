// Series mensuales y deudas: transformaciones puras de los datos que devuelve la base de datos.
import { yearMonthInZone } from "@/lib/trip/stats"

export interface MonthRow {
  /** `YYYY-MM` en hora de Madrid. */
  month: string
  trips: number
  spendCents: number
  km: number
  energyUnits: number
  co2Kg: number
  savingsCents: number
}

const empty = (month: string): MonthRow => ({ month, trips: 0, spendCents: 0, km: 0, energyUnits: 0, co2Kg: 0, savingsCents: 0 })

/** Devuelve exactamente `months` meses seguidos terminando en el actual, con ceros donde no hay viajes. */
export function fillMonths(rows: MonthRow[], now: Date, months = 12): MonthRow[] {
  const cur = yearMonthInZone(now)
  const byMonth = new Map(rows.map((r) => [r.month, r]))
  const out: MonthRow[] = []
  for (let i = months - 1; i >= 0; i--) {
    const index = cur.year * 12 + (cur.month - 1) - i
    const key = `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`
    out.push(byMonth.get(key) ?? empty(key))
  }
  return out
}

export interface PendingRow {
  name: string
  shareId: string
  title: string | null
  createdAt: Date
  amountCents: number
}

export interface Debtor {
  /** Clave de agrupación: nombre en minúsculas y sin espacios sobrantes. */
  key: string
  /** Nombre tal como se escribió la última vez. */
  name: string
  totalCents: number
  trips: { shareId: string; title: string | null; createdAt: Date; amountCents: number }[]
}

export const nameKey = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("es")

/** Agrupa lo pendiente por persona (sin distinguir mayúsculas), de mayor a menor deuda. */
export function groupDebts(rows: PendingRow[]): Debtor[] {
  const map = new Map<string, Debtor>()
  for (const row of [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
    const key = nameKey(row.name)
    const debtor = map.get(key) ?? { key, name: row.name.trim(), totalCents: 0, trips: [] }
    debtor.totalCents += row.amountCents
    debtor.trips.push({ shareId: row.shareId, title: row.title, createdAt: row.createdAt, amountCents: row.amountCents })
    map.set(key, debtor)
  }
  return [...map.values()].sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name, "es"))
}
