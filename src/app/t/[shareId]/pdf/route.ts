import QRCode from "qrcode"
import type { NextRequest } from "next/server"

import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { siteOrigin } from "@/lib/site"
import { buildTicketPdf } from "@/lib/trip/pdf"
import { tripTitle } from "@/lib/trip/share"
import { loadTicket } from "@/lib/trip/ticket"

export async function GET(request: NextRequest, { params }: RouteContext<"/t/[shareId]/pdf">) {
  const limit = await rateLimit(request, { name: "ticket-pdf", limit: 20, windowSec: 60 })
  if (!limit.ok) return tooManyRequests(limit)

  const { shareId } = await params
  const lookup = await loadTicket(shareId)
  if (lookup.status !== "ok") return new Response("Ticket no encontrado", { status: 404 })
  const { trip, passengers } = lookup

  const url = `${await siteOrigin()}/t/${trip.shareId}`
  const qrPng = await QRCode.toBuffer(url, { type: "png", margin: 1, width: 360 })
  const title = tripTitle(trip.title, trip.stops)

  const bytes = await buildTicketPdf({
    title,
    stops: trip.stops,
    geometry: trip.geometry,
    distanceKm: trip.distanceKm,
    isRoundTrip: trip.isRoundTrip,
    fuelType: trip.fuelType,
    energyUnits: trip.energyUnits,
    energyCents: trip.energyCents,
    tollsCents: trip.tollsCents,
    extras: trip.extras,
    totalCents: trip.totalCents,
    co2Kg: trip.co2Kg,
    createdAt: trip.createdAt,
    url,
    passengers: passengers.map((p) => ({ name: p.name, amountCents: p.amountCents, hasPaid: p.hasPaid, isDriver: p.position === 0 })),
    qrPng: new Uint8Array(qrPng),
  })

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${trip.shareId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  })
}
