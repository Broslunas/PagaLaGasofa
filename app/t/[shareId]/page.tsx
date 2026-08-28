import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/ticket/copy-link-button";
import { DownloadImageButton } from "@/components/ticket/download-image-button";
import { TicketMap } from "@/components/ticket/ticket-map";
import { PassengerPaidToggle } from "@/components/ticket/passenger-paid-toggle";
import { shortenAddress } from "@/lib/format-address";
import { ArrowRight, Fuel, Receipt, Route, Users } from "lucide-react";

export default async function TicketPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const trip = await prisma.trip.findUnique({ where: { shareId } });
  if (!trip) notFound();

  const shortOrigin = shortenAddress(trip.origin);
  const shortDest = shortenAddress(trip.destination);
  const stopLabels = ["Origen", ...trip.waypoints.map((_, i) => `Parada ${i + 1}`), "Destino"];

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header con resumen conciso de ruta */}
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/90 to-card p-4 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Receipt size={12} /> Ticket de viaje
            </span>
            {trip.title ? (
              <div className="mt-2">
                <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl md:text-3xl break-words">
                  {trip.title}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-muted-foreground">
                  <span className="break-words">{shortOrigin}</span>
                  <ArrowRight size={14} className="text-primary shrink-0" />
                  <span className="break-words">{shortDest}</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-heading text-lg font-bold text-foreground sm:text-xl md:text-2xl">
                <span className="break-words">{shortOrigin}</span>
                <ArrowRight size={18} className="text-primary shrink-0" />
                <span className="break-words">{shortDest}</span>
              </div>
            )}
            <p className="mt-1 break-words text-xs text-muted-foreground">
              {trip.origin} → {trip.destination}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <CopyLinkButton shareId={shareId} />
            <DownloadImageButton shareId={shareId} />
          </div>
        </div>

        {/* Layout de 2 columnas: Datos a la izquierda y Mapa a la derecha */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* Columna Izquierda: Métricas y Pasajeros */}
          <div className="space-y-6 md:col-span-7">
            {/* Tarjeta de métricas principales */}
            <Card className="border-border/60 bg-card/80">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3 text-center sm:gap-3 sm:p-4">
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-muted-foreground">Coste total</span>
                    <p className="text-2xl font-extrabold text-foreground sm:text-3xl">
                      {trip.totalCost.toFixed(2)} €
                    </p>
                  </div>
                  <div className="min-w-0 border-l border-border/60">
                    <span className="text-xs font-medium text-muted-foreground">
                      Por persona ({trip.passengers.length})
                    </span>
                    <p className="text-2xl font-extrabold text-primary sm:text-3xl">
                      {trip.costPerPassenger.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 sm:gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-1 rounded-lg border border-border/40 p-2.5">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Route size={14} className="text-primary" /> Distancia
                    </span>
                    <span className="font-semibold text-foreground">
                      {trip.distanceKm.toFixed(1)} km {trip.isRoundTrip ? "(I/V)" : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 rounded-lg border border-border/40 p-2.5">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Fuel size={14} className="text-primary" /> Consumo
                    </span>
                    <span className="font-semibold text-foreground">
                      {trip.consumptionL100.toFixed(1)} l/100km
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3.5 py-2.5 text-xs font-medium text-primary">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} /> El conductor recupera:
                  </span>
                  <span className="text-sm font-bold">{trip.driverReceives.toFixed(2)} €</span>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Pasajeros y pagos */}
            <Card className="border-border/60 bg-card/80">
              <CardContent className="space-y-3 p-5">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pasajeros & Bizums
                </span>
                <div className="space-y-2">
                  {trip.passengers.map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg border border-border/40 bg-muted/20 px-3.5 py-2.5 text-sm"
                    >
                      <span className="min-w-0 font-medium break-words text-foreground">
                        {p.name}
                        {trip.waypoints.length > 0 &&
                          p.pickupStop != null &&
                          p.dropoffStop != null && (
                            <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                              {stopLabels[p.pickupStop]} → {stopLabels[p.dropoffStop]}
                            </span>
                          )}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{p.amount.toFixed(2)} €</span>
                        <PassengerPaidToggle shareId={shareId} index={i} initialHasPaid={p.hasPaid} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Mapa con puntos exactos de origen y destino */}
          <div className="flex flex-col md:col-span-5">
            <TicketMap
              originLabel={trip.origin}
              destinationLabel={trip.destination}
              originLat={trip.originLat}
              originLon={trip.originLon}
              destLat={trip.destLat}
              destLon={trip.destLon}
              waypoints={trip.waypoints}
              geometry={trip.geometry}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
