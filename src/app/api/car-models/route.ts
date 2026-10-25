import { desc, ilike, sql } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { getDb } from "@/db"
import { carModels } from "@/db/schema"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"

/** Búsqueda en el catálogo de modelos: todas las palabras deben aparecer en «marca modelo». */
export async function GET(request: NextRequest) {
  const limit = await rateLimit(request, { name: "car-models", limit: 90, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60)
  const words = q.split(/\s+/).filter(Boolean).slice(0, 5)
  if (words.length === 0 || q.length < 2) return NextResponse.json({ results: [] })

  const escape = (w: string) => w.replace(/[\\%_]/g, "\\$&")
  const haystack = sql`${carModels.make} || ' ' || ${carModels.model}`
  const conditions = words.map((w) => ilike(haystack, `%${escape(w)}%`))

  const rows = await getDb()
    .select({
      id: carModels.id,
      make: carModels.make,
      model: carModels.model,
      fuelType: carModels.fuelType,
      consumptionPer100km: carModels.consumptionPer100km,
    })
    .from(carModels)
    .where(sql.join(conditions, sql` and `))
    .orderBy(desc(carModels.registrations))
    .limit(12)

  return NextResponse.json({ results: rows }, { headers: { "Cache-Control": "public, max-age=300" } })
}
