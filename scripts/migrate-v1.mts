// Migra los datos de la v1 (MongoDB) a la v2 (Postgres/Supabase).
//
//   pnpm db:migrate-v1                     simulación: lee y cuenta, no escribe nada
//   pnpm db:migrate-v1 --apply             aplica los cambios
//   pnpm db:migrate-v1 --apply --history   además trae el histórico de precios (puede ser grande)
//   pnpm db:migrate-v1 --apply --include-push   además migra los dispositivos con avisos push
//   --from-json fichero.json               lee de un JSON {User:[], Account:[], …} en vez de MongoDB
//
// Variables: V1_MONGODB_URI (cadena de la base de datos antigua) y DATABASE_URL (Postgres nuevo).
// Es idempotente: se puede ejecutar varias veces sin duplicar nada.
import { createHash, randomBytes } from "node:crypto"
import { readFileSync } from "node:fs"

import postgres from "postgres"

import {
  mapSnapshot, mapTrip, mapUser, mapVehicle, stableUuid,
  type V1Account, type V1Favorite, type V1Push, type V1Snapshot, type V1Trip, type V1User, type V1Vehicle,
} from "../src/lib/migrate/v1"

const args = new Set(process.argv.slice(2))
const APPLY = args.has("--apply")
const HISTORY = args.has("--history")
const PUSH = args.has("--include-push")
const fromJson = process.argv.includes("--from-json") ? process.argv[process.argv.indexOf("--from-json") + 1] : null

interface Source {
  all<T>(collection: string): Promise<T[]>
  snapshots(): AsyncGenerator<V1Snapshot[]>
  close(): Promise<void>
}

async function openSource(): Promise<Source> {
  if (fromJson) {
    const data = JSON.parse(readFileSync(fromJson, "utf8")) as Record<string, unknown[]>
    return {
      all: async <T,>(c: string) => (data[c] ?? []) as T[],
      async *snapshots() { yield (data.StationPriceSnapshot ?? []) as V1Snapshot[] },
      close: async () => {},
    }
  }
  const uri = process.env.V1_MONGODB_URI
  if (!uri) throw new Error("Falta V1_MONGODB_URI (cadena de MongoDB de la v1) o indica --from-json")
  const { MongoClient } = await import("mongodb")
  const client = await new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 }).connect()
  const db = client.db()
  return {
    all: async <T,>(c: string) => (await db.collection(c).find({}).toArray()) as unknown as T[],
    async *snapshots() {
      const cursor = db.collection("StationPriceSnapshot").find({}, { batchSize: 5000 })
      let batch: V1Snapshot[] = []
      for await (const doc of cursor) {
        batch.push(doc as unknown as V1Snapshot)
        if (batch.length >= 5000) { yield batch; batch = [] }
      }
      if (batch.length) yield batch
    },
    close: () => client.close(),
  }
}

const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { prepare: false, max: 2 }) : null
const count: Record<string, number> = {}
const bump = (key: string, n = 1) => (count[key] = (count[key] ?? 0) + n)
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex")

async function main() {
  console.log(APPLY ? "▶ APLICANDO cambios" : "▶ SIMULACIÓN (usa --apply para escribir)")
  const src = await openSource()
  const [users, accounts, vehicles, trips, favorites, pushes] = await Promise.all([
    src.all<V1User>("User"), src.all<V1Account>("Account"), src.all<V1Vehicle>("Vehicle"),
    src.all<V1Trip>("Trip"), src.all<V1Favorite>("FavoriteStation"), PUSH ? src.all<V1Push>("PushSubscription") : Promise.resolve([] as V1Push[]),
  ])
  console.log(`Leído de la v1: ${users.length} usuarios, ${vehicles.length} vehículos, ${trips.length} viajes, ${favorites.length} favoritas`)

  // --- Usuarios: un id de la v2 por cada usuario de la v1 (el existente si ya entró con el mismo correo) ---
  const userMap = new Map<string, string>()
  const toCreate: ReturnType<typeof mapUser>[] = []
  const existing = new Map<string, string>()
  if (sql) for (const r of await sql`select id, lower(email) as email from auth.users where email is not null`) existing.set(r.email, r.id)

  for (const u of users) {
    const mapped = mapUser(u, accounts.filter((a) => String(a.userId) === String(u._id)))
    if (!mapped) { bump("usuarios sin correo (omitidos)"); continue }
    const already = existing.get(mapped.email)
    if (already) { userMap.set(mapped.v1Id, already); bump("usuarios que ya existían en v2 (se enlazan)"); continue }
    userMap.set(mapped.v1Id, stableUuid("user", mapped.v1Id))
    toCreate.push(mapped)
    bump("usuarios a crear")
  }

  const hasPush = new Set(pushes.map((p) => String(p.userId)))
  const tripRows = trips.map((t) => ({ t, r: mapTrip(t) }))
  for (const { r } of tripRows) if (!r.ok) bump(`viajes omitidos: ${r.reason}`)
  const okTrips = tripRows.flatMap(({ r }) => (r.ok ? [r.value] : []))
  const vehicleRows = vehicles.flatMap((v) => { const m = mapVehicle(v); return m && userMap.has(String(v.userId)) ? [{ ...m, userId: userMap.get(String(v.userId))! }] : [] })
  bump("viajes a migrar", okTrips.length)
  bump("vehículos a migrar", vehicleRows.length)
  bump("viajes con cuenta", okTrips.filter((t) => t.trip.v1UserId && userMap.has(t.trip.v1UserId)).length)
  bump("viajes anónimos (caducarán en 1 año)", okTrips.filter((t) => !t.trip.v1UserId || !userMap.has(t.trip.v1UserId)).length)

  if (APPLY && sql) {
    await sql.begin(async (tx) => {
      for (const u of toCreate) {
        if (!u) continue
        const id = userMap.get(u.v1Id)!
        const meta = { iss: "https://accounts.google.com", sub: u.googleSub, name: u.name, full_name: u.name, email: u.email, picture: u.image, avatar_url: u.image, provider_id: u.googleSub, email_verified: true }
        await tx`insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
          values (${id}, ${"00000000-0000-0000-0000-000000000000"}, ${"authenticated"}, ${"authenticated"}, ${u.email}, ${u.verifiedAt},
            ${tx.json({ provider: "google", providers: ["google"] })}, ${tx.json(meta)}, now(), now(), ${""}, ${""}, ${""}, ${""}, ${""}, ${""}, ${""}, ${""})
          on conflict (id) do nothing`
        if (u.googleSub) {
          await tx`insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
            values (${stableUuid("identity", u.v1Id)}, ${id}, ${u.googleSub}, ${"google"}, ${tx.json({ sub: u.googleSub, email: u.email, name: u.name, picture: u.image, email_verified: true })}, now(), now(), now())
            on conflict do nothing`
        }
        bump("usuarios creados")
      }

      // Vehículos: solo uno predeterminado por usuario (el de v2 si ya había).
      const withDefault = new Set((await tx`select distinct user_id::text as u from vehicles where is_default`).map((r) => r.u))
      for (const v of vehicleRows) {
        const makeDefault = v.isDefault && !withDefault.has(v.userId)
        if (makeDefault) withDefault.add(v.userId)
        const r = await tx`insert into vehicles (id, user_id, brand, model, year, fuel_type, consumption_per_100km, is_default, created_at)
          values (${v.id}, ${v.userId}, ${v.brand}, ${v.model}, ${v.year}, ${v.fuelType}, ${v.consumptionPer100km}, ${makeDefault}, ${v.createdAt}) on conflict (id) do nothing returning id`
        bump(r.length ? "vehículos creados" : "vehículos ya migrados")
      }

      // Viajes y pasajeros.
      const anonExpiry = new Date(Date.now() + 365 * 24 * 3600 * 1000)
      for (const { trip: t, passengers } of okTrips) {
        const owner = t.v1UserId ? (userMap.get(t.v1UserId) ?? null) : null
        const r = await tx`insert into trips (id, share_id, manage_token_hash, user_id, title, stops, legs_km, geometry, distance_km, is_round_trip, fuel_type,
            consumption_per_100km, price_per_unit, tolls_cents, extras, driver_pays, split_mode, energy_units, co2_kg, energy_cents, total_cents, expires_at, created_at)
          values (${t.id}, ${t.shareId}, ${sha256(randomBytes(24).toString("hex"))}, ${owner}, ${t.title}, ${tx.json(t.stops)}, ${tx.json(t.legsKm)}, ${tx.json(t.geometry)}, ${t.distanceKm},
            ${t.isRoundTrip}, ${t.fuelType}, ${t.consumptionPer100km}, ${t.pricePerUnit}, ${t.tollsCents}, ${tx.json(t.extras)}, true, ${"legs"}, ${t.energyUnits}, ${t.co2Kg},
            ${t.energyCents}, ${t.totalCents}, ${owner ? null : anonExpiry}, ${t.createdAt})
          on conflict do nothing returning id`
        if (!r.length) { bump("viajes ya migrados"); continue }
        for (const p of passengers) {
          await tx`insert into trip_passengers (trip_id, position, name, pickup_stop, dropoff_stop, amount_cents, has_paid, paid_at)
            values (${t.id}, ${p.position}, ${p.name}, ${p.pickupStop}, ${p.dropoffStop}, ${p.amountCents}, ${p.hasPaid}, ${p.hasPaid ? t.createdAt : null}) on conflict do nothing`
        }
        bump("viajes creados")
      }

      // Favoritas: solo de estaciones que siguen en el catálogo. Con alerta si el usuario recibía avisos en la v1.
      const stationIds = new Set((await tx`select id from stations`).map((r) => r.id as string))
      for (const f of favorites) {
        const userId = userMap.get(String(f.userId))
        if (!userId) continue
        if (!stationIds.has(f.stationId)) { bump("favoritas omitidas (estación ya no existe)"); continue }
        const r = await tx`insert into favorite_stations (user_id, station_id, alert_enabled) values (${userId}, ${f.stationId}, ${hasPush.has(String(f.userId))}) on conflict do nothing returning station_id`
        bump(r.length ? "favoritas creadas" : "favoritas ya migradas")
      }

      // Dispositivos push (solo funcionan si producción usa las MISMAS claves VAPID que la v1).
      for (const p of pushes) {
        const userId = userMap.get(String(p.userId))
        if (!userId) continue
        const r = await tx`insert into push_subscriptions (user_id, endpoint, p256dh, auth) values (${userId}, ${p.endpoint}, ${p.p256dh}, ${p.auth}) on conflict do nothing returning id`
        bump(r.length ? "dispositivos push creados" : "dispositivos push ya migrados")
      }
    })
  } else {
    bump("favoritas a migrar", favorites.filter((f) => userMap.has(String(f.userId))).length)
    if (PUSH) bump("dispositivos push a migrar", pushes.filter((p) => userMap.has(String(p.userId))).length)
  }

  // --- Histórico de precios (aparte: puede ser muy grande) ---
  if (HISTORY) {
    const stationIds = sql ? new Set((await sql`select id from stations`).map((r) => r.id as string)) : null
    for await (const batch of src.snapshots()) {
      const rows = batch.flatMap((s) => { const m = mapSnapshot(s); return m && (!stationIds || stationIds.has(m.stationId)) ? [m] : [] })
      bump("histórico: filas leídas", batch.length)
      bump("histórico: filas válidas", rows.length)
      if (APPLY && sql && rows.length) {
        const col = <T,>(f: (r: (typeof rows)[number]) => T) => rows.map(f)
        await sql`insert into station_price_history (station_id, day, price_gasolina95, price_gasolina98, price_diesel, price_diesel_premium, price_glp)
          select u.id, u.day::date, u.a, u.b, u.c, u.d, u.e from unnest(${col((r) => r.stationId)}::text[], ${col((r) => r.day)}::text[], ${col((r) => r.gasolina95)}::float8[],
            ${col((r) => r.gasolina98)}::float8[], ${col((r) => r.diesel)}::float8[], ${col((r) => r.dieselPremium)}::float8[], ${col((r) => r.glp)}::float8[]) as u(id, day, a, b, c, d, e)
          on conflict (station_id, day) do nothing`
      }
    }
  }

  await src.close()
  console.log("\nResumen")
  for (const [k, v] of Object.entries(count)) console.log(`  ${String(v).padStart(7)}  ${k}`)
  if (!APPLY) console.log("\nNo se ha escrito nada. Revisa el resumen y vuelve a ejecutar con --apply.")
  await sql?.end()
}

main().catch(async (e) => { console.error("✗", e.message); await sql?.end(); process.exit(1) })
