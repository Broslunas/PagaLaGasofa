import { and, asc, eq, gte, lt, sql } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { getDb } from "@/db"
import { tripPassengers, trips } from "@/db/schema"
import { getProfile, getUser } from "@/lib/auth/session"
import { fillMonths, type MonthRow } from "@/lib/dashboard/series"
import { buildYearReport } from "@/lib/dashboard/report-pdf"
import { shortPlace } from "@/lib/trip/share"

/** Informe anual en PDF con las cifras del año natural (hora de Madrid). */
export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })

  const now = new Date()
  const year = Number(request.nextUrl.searchParams.get("year")) || now.getFullYear()
  if (year < 2020 || year > now.getFullYear() + 1) return NextResponse.json({ error: "Año no válido" }, { status: 400 })

  const start = new Date(`${year}-01-01T00:00:00+01:00`)
  const end = new Date(`${year + 1}-01-01T00:00:00+01:00`)
  const db = getDb()
  const [profile, list] = await Promise.all([
    getProfile(user.id),
    db
      .select({
        trip: trips,
        pendingCents: sql<number>`(select coalesce(sum(p.amount_cents), 0)::int from ${tripPassengers} p where p.trip_id = "trips"."id" and p.position > 0 and p.amount_cents > 0 and not p.has_paid)`,
      })
      .from(trips)
      .where(and(eq(trips.userId, user.id), gte(trips.createdAt, start), lt(trips.createdAt, end)))
      .orderBy(asc(trips.createdAt)),
  ])

  const fmt = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "2-digit" })
  const monthKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit" }).format(d).slice(0, 7)
  const byMonth = new Map<string, MonthRow>()
  let savings = 0
  for (const { trip } of list) {
    const key = monthKey(trip.createdAt)
    const m = byMonth.get(key) ?? { month: key, trips: 0, spendCents: 0, km: 0, energyUnits: 0, co2Kg: 0, savingsCents: 0 }
    const saved = trip.routePriceMax === null ? 0 : Math.max(0, trip.routePriceMax - trip.pricePerUnit) * trip.energyUnits * 100
    m.trips += 1; m.spendCents += trip.totalCents; m.km += trip.distanceKm; m.energyUnits += trip.energyUnits; m.co2Kg += trip.co2Kg; m.savingsCents += Math.round(saved)
    savings += saved
    byMonth.set(key, m)
  }
  // Los 12 meses del año pedido (si es el actual, hasta diciembre aunque falten datos).
  const months = fillMonths([...byMonth.values()], new Date(`${year}-12-15T12:00:00Z`), 12)

  const bytes = await buildYearReport({
    year,
    name: profile?.displayName ?? user.email ?? "",
    months,
    trips: list.map(({ trip, pendingCents }) => ({
      date: fmt.format(trip.createdAt),
      title: trip.title || `${shortPlace(trip.stops[0].label)} -> ${shortPlace(trip.stops[trip.stops.length - 1].label)}`,
      km: trip.distanceKm,
      totalCents: trip.totalCents,
      pendingCents,
    })),
    totals: {
      trips: list.length,
      km: list.reduce((s, r) => s + r.trip.distanceKm, 0),
      spendCents: list.reduce((s, r) => s + r.trip.totalCents, 0),
      co2Kg: list.reduce((s, r) => s + r.trip.co2Kg, 0),
      savingsCents: Math.round(savings),
      pendingCents: list.reduce((s, r) => s + r.pendingCents, 0),
    },
  })

  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="pagalagasofa-informe-${year}.pdf"`, "Cache-Control": "private, no-store" },
  })
}
