import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  date,
  doublePrecision,
  integer,
  jsonb,
  smallint,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { anonRole, authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase"

import { FUEL_TYPES, type FuelType } from "@/lib/trip/fuel"

/**
 * Combustibles soportados. Coinciden con los de MITECO (Fase 7) más electricidad.
 */
export const fuelTypeEnum = pgEnum("fuel_type", FUEL_TYPES)

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}

/** Perfil público de la aplicación; una fila por usuario de `auth.users`. */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    ...timestamps,
  },
  (t) => [
    pgPolicy("profiles_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${t.id}`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = ${t.id}`,
      withCheck: sql`${authUid} = ${t.id}`,
    }),
  ],
).enableRLS()

/** Vehículos del garaje. El consumo es l/100 km o kWh/100 km según `fuelType`. */
export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name"),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    year: integer("year"),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    consumptionPer100km: numeric("consumption_per_100km", {
      precision: 5,
      scale: 2,
      mode: "number",
    }).notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("vehicles_user_id_idx").on(t.userId),
    // Como mucho un vehículo predeterminado por usuario.
    uniqueIndex("vehicles_one_default_per_user")
      .on(t.userId)
      .where(sql`${t.isDefault}`),
    pgPolicy("vehicles_all_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${authUid} = ${t.userId}`,
      withCheck: sql`${authUid} = ${t.userId}`,
    }),
  ],
).enableRLS()

export type Profile = typeof profiles.$inferSelect
export type Vehicle = typeof vehicles.$inferSelect
export type NewVehicle = typeof vehicles.$inferInsert
export type { FuelType }

/**
 * Contadores de ventana fija para limitar peticiones a endpoints públicos.
 * RLS activado sin políticas: solo accesible con la conexión directa del servidor.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (t) => [
    primaryKey({ columns: [t.key, t.windowStart] }),
    index("rate_limits_window_start_idx").on(t.windowStart),
  ],
).enableRLS()

/**
 * Catálogo público de modelos con su consumo oficial (WLTP, EEA).
 * Lectura abierta; solo se escribe con el script de importación.
 */
export const carModels = pgTable(
  "car_models",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    /** l/100 km o kWh/100 km según `fuelType`. */
    consumptionPer100km: numeric("consumption_per_100km", { precision: 5, scale: 2, mode: "number" }).notNull(),
    co2GramsPerKm: integer("co2_g_km"),
    /** Matriculaciones usadas como peso y para ordenar por popularidad. */
    registrations: integer("registrations").notNull().default(0),
    dataYear: smallint("data_year").notNull(),
  },
  (t) => [
    uniqueIndex("car_models_make_model_fuel_idx").on(t.make, t.model, t.fuelType),
    index("car_models_popularity_idx").on(t.registrations),
    pgPolicy("car_models_public_read", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS()

export const splitModeEnum = pgEnum("split_mode", ["legs", "equal", "percent", "manual"])

export interface TripStop {
  label: string
  lat: number
  lng: number
}

export interface TripExtraRow {
  label: string
  amountCents: number
}

/**
 * Viaje con su ticket compartible. `userId` es nulo en tickets anónimos.
 * Los importes se guardan en céntimos y siempre se calculan en el servidor.
 */
export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Identificador público del enlace de lectura (no adivinable). */
    shareId: text("share_id").notNull(),
    /** SHA-256 del token secreto de gestión. */
    manageTokenHash: text("manage_token_hash").notNull(),
    userId: uuid("user_id").references(() => authUsers.id, { onDelete: "set null" }),
    title: text("title"),
    stops: jsonb("stops").$type<TripStop[]>().notNull(),
    legsKm: jsonb("legs_km").$type<number[]>().notNull(),
    /** Geometría de la ruta como pares [lng, lat]. */
    geometry: jsonb("geometry").$type<[number, number][]>().notNull(),
    distanceKm: numeric("distance_km", { precision: 8, scale: 2, mode: "number" }).notNull(),
    isRoundTrip: boolean("is_round_trip").notNull().default(false),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    consumptionPer100km: numeric("consumption_per_100km", { precision: 5, scale: 2, mode: "number" }).notNull(),
    pricePerUnit: numeric("price_per_unit", { precision: 6, scale: 3, mode: "number" }).notNull(),
    tollsCents: integer("tolls_cents").notNull().default(0),
    extras: jsonb("extras").$type<TripExtraRow[]>().notNull().default([]),
    driverPays: boolean("driver_pays").notNull().default(true),
    splitMode: splitModeEnum("split_mode").notNull().default("legs"),
    energyUnits: numeric("energy_units", { precision: 8, scale: 2, mode: "number" }).notNull(),
    co2Kg: numeric("co2_kg", { precision: 8, scale: 2, mode: "number" }).notNull(),
    energyCents: integer("energy_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    /** Los tickets anónimos caducan; los de usuarios con cuenta no. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("trips_share_id_idx").on(t.shareId),
    index("trips_user_created_idx").on(t.userId, t.createdAt),
    pgPolicy("trips_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${t.userId}`,
    }),
  ],
).enableRLS()

export const tripPassengers = pgTable(
  "trip_passengers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    /** 0 = conductor. */
    position: smallint("position").notNull(),
    name: text("name").notNull(),
    pickupStop: smallint("pickup_stop").notNull(),
    dropoffStop: smallint("dropoff_stop").notNull(),
    /** Porcentaje o euros según `trips.splitMode`; nulo en los demás modos. */
    splitValue: numeric("split_value", { precision: 10, scale: 2, mode: "number" }),
    amountCents: integer("amount_cents").notNull(),
    hasPaid: boolean("has_paid").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("trip_passengers_trip_position_idx").on(t.tripId, t.position),
    pgPolicy("trip_passengers_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${trips} where ${trips.id} = ${t.tripId} and ${trips.userId} = ${authUid})`,
    }),
  ],
).enableRLS()

export type Trip = typeof trips.$inferSelect
export type TripPassengerRow = typeof tripPassengers.$inferSelect
export type CarModel = typeof carModels.$inferSelect

const priceColumns = {
  priceGasolina95: numeric("price_gasolina95", { precision: 5, scale: 3, mode: "number" }),
  priceGasolina98: numeric("price_gasolina98", { precision: 5, scale: 3, mode: "number" }),
  priceDiesel: numeric("price_diesel", { precision: 5, scale: 3, mode: "number" }),
  priceDieselPremium: numeric("price_diesel_premium", { precision: 5, scale: 3, mode: "number" }),
  priceGlp: numeric("price_glp", { precision: 5, scale: 3, mode: "number" }),
}

/**
 * Gasolineras de España, sincronizadas cada hora desde MITECO.
 * Lectura pública; solo escribe la sincronización (conexión directa del servidor).
 */
export const stations = pgTable(
  "stations",
  {
    /** IDEESS de MITECO. */
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /** Marca normalizada en mayúsculas; vacía si no hay rótulo comercial. */
    brand: text("brand").notNull().default(""),
    address: text("address").notNull().default(""),
    locality: text("locality").notNull().default(""),
    municipality: text("municipality").notNull().default(""),
    province: text("province").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    schedule: text("schedule").notNull().default(""),
    publicSale: boolean("public_sale").notNull().default(true),
    ...priceColumns,
    /** Última sincronización en la que apareció; las que dejan de aparecer se ocultan. */
    seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("stations_lat_lng_idx").on(t.lat, t.lng),
    index("stations_brand_idx").on(t.brand),
    pgPolicy("stations_public_read", { for: "select", to: [anonRole, authenticatedRole], using: sql`true` }),
  ],
).enableRLS()

/** Un precio por estación y día (el de la última sincronización del día, hora de Madrid). */
export const stationPriceHistory = pgTable(
  "station_price_history",
  {
    stationId: text("station_id")
      .notNull()
      .references(() => stations.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    ...priceColumns,
  },
  (t) => [
    primaryKey({ columns: [t.stationId, t.day] }),
    index("station_price_history_day_idx").on(t.day),
    pgPolicy("station_price_history_public_read", { for: "select", to: [anonRole, authenticatedRole], using: sql`true` }),
  ],
).enableRLS()

export const favoriteStations = pgTable(
  "favorite_stations",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    stationId: text("station_id")
      .notNull()
      .references(() => stations.id, { onDelete: "cascade" }),
    /** Combustible que se mostrará y vigilará en esta favorita. */
    fuelType: fuelTypeEnum("fuel_type").notNull().default("gasolina95"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.stationId] }),
    pgPolicy("favorite_stations_all_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${authUid} = ${t.userId}`,
      withCheck: sql`${authUid} = ${t.userId}`,
    }),
  ],
).enableRLS()

export type Station = typeof stations.$inferSelect
