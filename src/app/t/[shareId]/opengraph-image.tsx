import { ImageResponse } from "next/og"

import { formatCents, formatNumber } from "@/lib/format"
import { shortPlace, tripTitle } from "@/lib/trip/share"
import { payingPassengers } from "@/lib/trip/payments"
import { loadTicket } from "@/lib/trip/ticket"

export const alt = "Ticket de viaje de PagaLaGasofa"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage({ params }: { params: Promise<{ shareId: string }> }) {
  const lookup = await loadTicket((await params).shareId)

  if (lookup.status !== "ok") {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#14886a", color: "white", fontSize: 64 }}>
          PagaLaGasofa
        </div>
      ),
      size,
    )
  }

  const { trip, passengers } = lookup
  const title = tripTitle(trip.title, trip.stops)
  const first = shortPlace(trip.stops[0].label)
  const last = shortPlace(trip.stops[trip.stops.length - 1].label)
  const pay = payingPassengers(passengers).slice(0, 4)
  const more = payingPassengers(passengers).length - pay.length

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fbfaf5", color: "#14201f" }}>
        <div style={{ display: "flex", height: 14 }}>
          <div style={{ flex: 1, background: "#14886a" }} />
          <div style={{ flex: 1, background: "#f5b81c" }} />
        </div>
        <div style={{ display: "flex", flex: 1, padding: "48px 64px", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 28, color: "#14886a", fontWeight: 700 }}>PagaLaGasofa</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.1 }}>{title.length > 44 ? `${title.slice(0, 43)}…` : title}</div>
              <div style={{ display: "flex", fontSize: 30, color: "#5a6664", marginTop: 14 }}>
                {first} → {last} · {formatNumber(trip.distanceKm)} km
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 24, color: "#5a6664" }}>Total del viaje</div>
              <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1 }}>{formatCents(trip.totalCents)}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 400, background: "white", borderRadius: 28, padding: 32, border: "2px solid #e3e6e1", justifyContent: "center" }}>
            <div style={{ display: "flex", fontSize: 24, color: "#5a6664", marginBottom: 12 }}>Cada uno paga</div>
            {pay.map((p) => (
              <div key={p.position} style={{ display: "flex", justifyContent: "space-between", fontSize: 32, padding: "10px 0", borderBottom: "1px solid #eceee9" }}>
                <div style={{ display: "flex" }}>{p.name.length > 12 ? `${p.name.slice(0, 11)}…` : p.name}</div>
                <div style={{ display: "flex", fontWeight: 700 }}>{formatCents(p.amountCents)}</div>
              </div>
            ))}
            {more > 0 && <div style={{ display: "flex", fontSize: 24, color: "#5a6664", marginTop: 12 }}>y {more} más</div>}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
