import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
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
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase"

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
