import { sql } from "drizzle-orm"
import {
  boolean,
  index,
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
