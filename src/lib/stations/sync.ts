// Sincroniza el catálogo de gasolineras y el histórico diario con el feed de MITECO.
// Recibe la conexión por parámetro para usarse igual desde la ruta de cron y desde un script.
import type { Sql } from "postgres"

import { fetchMiteco, type StationRecord } from "./miteco"

const CHUNK = 1500
const MIN_EXPECTED = 5000 // el feed real tiene unas 11.000; menos indica un fallo del origen

/** Fecha (YYYY-MM-DD) en hora de Madrid: el «día» del histórico. */
export const madridDay = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)

export interface SyncResult {
  stations: number
  day: string
  ms: number
}

export async function syncStations(sql: Sql, now = new Date()): Promise<SyncResult> {
  const started = Date.now()
  const records = await fetchMiteco()
  if (records.length < MIN_EXPECTED) throw new Error(`Feed sospechoso: solo ${records.length} estaciones`)
  const day = madridDay(now)

  for (let i = 0; i < records.length; i += CHUNK) {
    const c = records.slice(i, i + CHUNK)
    const col = <T>(f: (r: StationRecord) => T) => c.map(f)
    await sql`
      insert into stations (id, name, brand, address, locality, municipality, province, postal_code, lat, lng, schedule, public_sale,
        price_gasolina95, price_gasolina98, price_diesel, price_diesel_premium, price_glp, seen_at)
      select u.*, now() from unnest(
        ${col((r) => r.id)}::text[], ${col((r) => r.name)}::text[], ${col((r) => r.brand)}::text[],
        ${col((r) => r.address)}::text[], ${col((r) => r.locality)}::text[], ${col((r) => r.municipality)}::text[],
        ${col((r) => r.province)}::text[], ${col((r) => r.postalCode)}::text[],
        ${col((r) => r.lat)}::float8[], ${col((r) => r.lng)}::float8[], ${col((r) => r.schedule)}::text[],
        ${sql.array(col((r) => r.publicSale), 1000)}::boolean[],
        ${col((r) => r.prices.gasolina95)}::float8[], ${col((r) => r.prices.gasolina98)}::float8[],
        ${col((r) => r.prices.diesel)}::float8[], ${col((r) => r.prices.dieselPremium)}::float8[],
        ${col((r) => r.prices.glp)}::float8[]
      ) as u
      on conflict (id) do update set
        name = excluded.name, brand = excluded.brand, address = excluded.address, locality = excluded.locality,
        municipality = excluded.municipality, province = excluded.province, postal_code = excluded.postal_code,
        lat = excluded.lat, lng = excluded.lng, schedule = excluded.schedule, public_sale = excluded.public_sale,
        price_gasolina95 = excluded.price_gasolina95, price_gasolina98 = excluded.price_gasolina98,
        price_diesel = excluded.price_diesel, price_diesel_premium = excluded.price_diesel_premium,
        price_glp = excluded.price_glp, seen_at = excluded.seen_at`

    // Los precios van como float8[] (el cliente de Drizzle desactiva la serialización de numeric[]).
    // El día va como valor único (no como array): el cliente de Drizzle cambia cómo se serializan los arrays de fechas.
    await sql`
      insert into station_price_history (station_id, day, price_gasolina95, price_gasolina98, price_diesel, price_diesel_premium, price_glp)
      select u.id, ${day}::date, u.p95, u.p98, u.d, u.dp, u.g from unnest(
        ${col((r) => r.id)}::text[],
        ${col((r) => r.prices.gasolina95)}::float8[], ${col((r) => r.prices.gasolina98)}::float8[],
        ${col((r) => r.prices.diesel)}::float8[], ${col((r) => r.prices.dieselPremium)}::float8[],
        ${col((r) => r.prices.glp)}::float8[]
      ) as u(id, p95, p98, d, dp, g)
      on conflict (station_id, day) do update set
        price_gasolina95 = excluded.price_gasolina95, price_gasolina98 = excluded.price_gasolina98,
        price_diesel = excluded.price_diesel, price_diesel_premium = excluded.price_diesel_premium,
        price_glp = excluded.price_glp`
  }

  // Retención del histórico: 400 días.
  await sql`delete from station_price_history where day < (${day}::date - 400)`

  return { stations: records.length, day, ms: Date.now() - started }
}
