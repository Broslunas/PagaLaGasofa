import "server-only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

// `prepare: false` es obligatorio con el pooler de Supabase en modo transacción.
const create = (url: string) => drizzle(postgres(url, { prepare: false, max: 5 }), { schema })

type Db = ReturnType<typeof create>
const globalForDb = globalThis as unknown as { db?: Db }

/** Conexión perezosa: no se abre (ni se exige DATABASE_URL) hasta la primera consulta. */
export function getDb(): Db {
  if (globalForDb.db) return globalForDb.db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("Falta DATABASE_URL")
  const db = create(url)
  if (process.env.NODE_ENV !== "production") globalForDb.db = db
  return db
}
