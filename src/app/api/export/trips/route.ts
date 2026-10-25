import { desc, eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"

import { getDb } from "@/db"
import { tripPassengers, trips } from "@/db/schema"
import { getUser } from "@/lib/auth/session"
import { toCsv } from "@/lib/dashboard/csv"
import { siteOrigin } from "@/lib/site"
import { FUEL_INFO } from "@/lib/trip/fuel"
import { shortPlace } from "@/lib/trip/share"

/** Viajes del usuario en CSV (separador `;`, listo para Excel en español). */
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })

  const db = getDb()
  const [list, origin] = await Promise.all([
    db
      .select({
        trip: trips,
        passengers: sql<number>`(select count(*)::int from ${tripPassengers} p where p.trip_id = "trips"."id")`,
        pendingCents: sql<number>`(select coalesce(sum(p.amount_cents), 0)::int from ${tripPassengers} p where p.trip_id = "trips"."id" and p.position > 0 and p.amount_cents > 0 and not p.has_paid)`,
      })
      .from(trips)
      .where(eq(trips.userId, user.id))
      .orderBy(desc(trips.createdAt)),
    siteOrigin(),
  ])

  const eur = (cents: number) => cents / 100
  const csv = toCsv(list, [
    { header: "Fecha", value: ({ trip }) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid" }).format(trip.createdAt) },
    { header: "Título", value: ({ trip }) => trip.title },
    { header: "Origen", value: ({ trip }) => shortPlace(trip.stops[0].label) },
    { header: "Destino", value: ({ trip }) => shortPlace(trip.stops[trip.stops.length - 1].label) },
    { header: "Distancia (km)", value: ({ trip }) => trip.distanceKm },
    { header: "Ida y vuelta", value: ({ trip }) => (trip.isRoundTrip ? "Sí" : "No") },
    { header: "Combustible", value: ({ trip }) => FUEL_INFO[trip.fuelType].label },
    { header: "Consumo (por 100 km)", value: ({ trip }) => trip.consumptionPer100km },
    { header: "Precio (€/unidad)", value: ({ trip }) => trip.pricePerUnit },
    { header: "Energía (l o kWh)", value: ({ trip }) => trip.energyUnits },
    { header: "Combustible (€)", value: ({ trip }) => eur(trip.energyCents) },
    { header: "Peajes (€)", value: ({ trip }) => eur(trip.tollsCents) },
    { header: "Otros gastos (€)", value: ({ trip }) => eur(trip.extras.reduce((s, e) => s + e.amountCents, 0)) },
    { header: "Total (€)", value: ({ trip }) => eur(trip.totalCents) },
    { header: "Personas", value: (r) => r.passengers },
    { header: "Pendiente de cobro (€)", value: (r) => eur(r.pendingCents) },
    { header: "CO2 (kg)", value: ({ trip }) => trip.co2Kg },
    { header: "Enlace", value: ({ trip }) => `${origin}/t/${trip.shareId}` },
  ])

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pagalagasofa-viajes.csv"',
      "Cache-Control": "private, no-store",
    },
  })
}
