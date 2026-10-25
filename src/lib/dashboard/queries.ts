// Consultas del panel. Reciben la base de datos por parámetro (sin `server-only`) para poder probarlas con un script.
import { sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import type * as schema from "@/db/schema"

import { fillMonths, groupDebts, type Debtor, type MonthRow, type PendingRow } from "./series"

export type AppDb = PostgresJsDatabase<typeof schema>

const rows = async <T>(db: AppDb, query: ReturnType<typeof sql>) => (await db.execute(query)) as unknown as T[]

export interface Summary {
  trips: number
  km: number
  spendCents: number
  co2Kg: number
  pendingCents: number
  pendingPeople: number
  savingsCents: number
}

/** Ahorro de un viaje: lo que habría costado repostar al precio más alto de la ruta menos lo que se pagó. */
const SAVINGS_SQL = sql`greatest(t.route_price_max - t.price_per_unit, 0) * t.energy_units * 100`

export async function getSummary(db: AppDb, userId: string): Promise<Summary> {
  const [totals] = await rows<{ trips: number; km: number; spend: number; co2: number; savings: number }>(
    db,
    sql`select count(*)::int as trips,
          coalesce(sum(t.distance_km), 0)::float as km,
          coalesce(sum(t.total_cents), 0)::float as spend,
          coalesce(sum(t.co2_kg), 0)::float as co2,
          coalesce(sum(case when t.route_price_max is not null then ${SAVINGS_SQL} else 0 end), 0)::float as savings
        from trips t where t.user_id = ${userId}`,
  )
  const [pending] = await rows<{ cents: number; people: number }>(
    db,
    sql`select coalesce(sum(p.amount_cents), 0)::float as cents, count(distinct lower(trim(p.name)))::int as people
        from trip_passengers p join trips t on t.id = p.trip_id
        where t.user_id = ${userId} and p.position > 0 and p.amount_cents > 0 and not p.has_paid`,
  )
  return {
    trips: totals.trips,
    km: totals.km,
    spendCents: Math.round(totals.spend),
    co2Kg: totals.co2,
    pendingCents: Math.round(pending.cents),
    pendingPeople: pending.people,
    savingsCents: Math.round(totals.savings),
  }
}

export interface TripListItem {
  shareId: string
  title: string | null
  from: string
  to: string
  distanceKm: number
  totalCents: number
  createdAt: Date
  passengers: number
  pendingCents: number
  pendingCount: number
}

export async function listTrips(db: AppDb, userId: string, opts: { limit: number; offset: number; q?: string }) {
  const like = opts.q ? `%${opts.q.replace(/[\\%_]/g, "\\$&")}%` : null
  const filter = like ? sql`and (coalesce(t.title, '') ilike ${like} or t.stops::text ilike ${like})` : sql``
  const list = await rows<{
    share_id: string; title: string | null; stops: { label: string }[]; distance_km: number; total_cents: number; created_at: Date
    passengers: number; pending_cents: number; pending_count: number
  }>(
    db,
    sql`select t.share_id, t.title, t.stops, t.distance_km::float, t.total_cents, t.created_at,
          (select count(*)::int from trip_passengers p where p.trip_id = t.id) as passengers,
          (select coalesce(sum(p.amount_cents), 0)::int from trip_passengers p where p.trip_id = t.id and p.position > 0 and p.amount_cents > 0 and not p.has_paid) as pending_cents,
          (select count(*)::int from trip_passengers p where p.trip_id = t.id and p.position > 0 and p.amount_cents > 0 and not p.has_paid) as pending_count
        from trips t where t.user_id = ${userId} ${filter}
        order by t.created_at desc limit ${opts.limit + 1} offset ${opts.offset}`,
  )
  const short = (label: string) => label.split(",")[0].trim()
  const items: TripListItem[] = list.slice(0, opts.limit).map((r) => ({
    shareId: r.share_id,
    title: r.title,
    from: short(r.stops[0].label),
    to: short(r.stops[r.stops.length - 1].label),
    distanceKm: r.distance_km,
    totalCents: r.total_cents,
    createdAt: new Date(r.created_at),
    passengers: r.passengers,
    pendingCents: r.pending_cents,
    pendingCount: r.pending_count,
  }))
  return { items, hasMore: list.length > opts.limit }
}

export async function monthlyStats(db: AppDb, userId: string, now = new Date(), months = 12): Promise<MonthRow[]> {
  const found = await rows<{ month: string; trips: number; spend: number; km: number; energy: number; co2: number; savings: number }>(
    db,
    sql`select to_char(date_trunc('month', t.created_at at time zone 'Europe/Madrid'), 'YYYY-MM') as month,
          count(*)::int as trips, sum(t.total_cents)::float as spend, sum(t.distance_km)::float as km,
          sum(t.energy_units)::float as energy, sum(t.co2_kg)::float as co2,
          sum(case when t.route_price_max is not null then ${SAVINGS_SQL} else 0 end)::float as savings
        from trips t
        where t.user_id = ${userId} and t.created_at >= now() - ${`${months + 1} months`}::interval
        group by 1`,
  )
  return fillMonths(
    found.map((r) => ({ month: r.month, trips: r.trips, spendCents: Math.round(r.spend), km: r.km, energyUnits: r.energy, co2Kg: r.co2, savingsCents: Math.round(r.savings) })),
    now,
    months,
  )
}

export async function getDebts(db: AppDb, userId: string): Promise<Debtor[]> {
  const pending = await rows<{ name: string; share_id: string; title: string | null; created_at: Date; amount_cents: number }>(
    db,
    sql`select p.name, t.share_id, t.title, t.created_at, p.amount_cents
        from trip_passengers p join trips t on t.id = p.trip_id
        where t.user_id = ${userId} and p.position > 0 and p.amount_cents > 0 and not p.has_paid`,
  )
  const mapped: PendingRow[] = pending.map((r) => ({ name: r.name, shareId: r.share_id, title: r.title, createdAt: new Date(r.created_at), amountCents: r.amount_cents }))
  return groupDebts(mapped)
}

/** Marca como pagado todo lo pendiente de una persona en los viajes del usuario. Devuelve los tickets afectados. */
export async function settleDebts(db: AppDb, userId: string, key: string): Promise<string[]> {
  const updated = await rows<{ share_id: string }>(
    db,
    sql`update trip_passengers p set has_paid = true, paid_at = now()
        from trips t
        where t.id = p.trip_id and t.user_id = ${userId} and p.position > 0 and p.amount_cents > 0 and not p.has_paid
          and lower(regexp_replace(trim(p.name), '\s+', ' ', 'g')) = ${key}
        returning t.share_id`,
  )
  return [...new Set(updated.map((r) => r.share_id))]
}
