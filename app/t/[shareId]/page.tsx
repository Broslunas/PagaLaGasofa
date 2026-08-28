import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/ticket/copy-link-button";
import { TicketMap } from "@/components/ticket/ticket-map";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/format-address";
import { ArrowRight, CheckCircle2, CircleDashed, Download, Fuel, Receipt, Route, Users } from "lucide-react";

export default async function TicketPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const trip = await prisma.trip.findUnique({ where: { shareId } });
  if (!trip) notFound();

  const shortOrigin = shortenAddress(trip.origin);
  const shortDest = shortenAddress(trip.destination);

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header con resumen conciso de ruta */}
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/90 to-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Receipt size={12} /> Ticket de viaje
            </span>
            <div className="mt-2 flex items-center gap-2 font-heading text-xl font-bold text-foreground md:text-2xl">
              <span>{shortOrigin}</span>
              <ArrowRight size={18} className="text-primary shrink-0" />
              <span>{shortDest}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {trip.origin} → {trip.destination}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CopyLinkButton shareId={shareId} />
            <Button
              variant="default"
              nativeButton={false}
              render={<a href={`/t/${shareId}/opengraph-image`} download={`ticket-${shareId}.png`} />}
            >
              <Download size={16} />
              Descargar PNG
            </Button>
          </div>
        </div>

        {/* Layout de 2 columnas: Datos a la izquierda y Mapa a la derecha */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* Columna Izquierda: Métricas y Pasajeros */}
          <div className="space-y-6 md:col-span-7">
            {/* Tarjeta de métricas principales */}
            <Card className="border-border/60 bg-card/80">
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-4 text-center">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Coste total</span>
                    <p className="text-3xl font-extrabold text-foreground">
                      {trip.totalCost.toFixed(2)} €
                    </p>
                  </div>
                  <div className="border-l border-border/60">
                    <span className="text-xs font-medium text-muted-foreground">
                      Por persona ({trip.passengers.length})
                    </span>
                    <p className="text-3xl font-extrabold text-primary">
                      {trip.costPerPassenger.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-2.5">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Route size={14} className="text-primary" /> Distancia
                    </span>
                    <span className="font-semibold text-foreground">
                      {trip.distanceKm} km {trip.isRoundTrip ? "(I/V)" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-2.5">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Fuel size={14} className="text-primary" /> Consumo
                    </span>
                    <span className="font-semibold text-foreground">
                      {trip.consumptionL100} l/100km
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
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3.5 py-2.5 text-sm"
                    >
                      <span className="font-medium text-foreground">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{p.amount.toFixed(2)} €</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                            p.hasPaid
                              ? "bg-green-500/10 text-green-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {p.hasPaid ? (
                            <>
                              <CheckCircle2 size={12} /> Pagado
                            </>
                          ) : (
                            <>
                              <CircleDashed size={12} /> Pendiente
                            </>
                          )}
                        </span>
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
              geometry={trip.geometry}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
