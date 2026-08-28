import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

// Satori (motor de ImageResponse) solo soporta estilos inline + flexbox,
// nada de Tailwind ni display:grid — node_modules/next/dist/docs/.../opengraph-image.md
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const trip = await prisma.trip.findUnique({ where: { shareId } });

  if (!trip) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            color: "#71717a",
            background: "#fafafa",
          }}
        >
          Ticket no encontrado
        </div>
      ),
      size
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#fafafa",
          padding: 64,
          color: "#18181b",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#71717a" }}>⛽ PagaLaGasofa</div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 44, fontWeight: 600 }}>
          {trip.origin} → {trip.destination}
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 96, fontWeight: 700 }}>
          {trip.totalCost.toFixed(2)} €
        </div>
        <div style={{ display: "flex", marginTop: 48, gap: 64 }}>
          <Stat label="Distancia" value={`${trip.distanceKm} km`} />
          <Stat label="Cada persona paga" value={`${trip.costPerPassenger.toFixed(2)} €`} />
          <Stat label="El conductor cobra" value={`${trip.driverReceives.toFixed(2)} €`} />
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 24, color: "#71717a" }}>
          {trip.passengers.length} personas
        </div>
      </div>
    ),
    size
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 22, color: "#71717a" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 32, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
