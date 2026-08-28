"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { shortenAddress } from "@/lib/format-address";
import { buildStops } from "@/lib/stops";
import { ArrowRight, Fuel, Loader2, Receipt, Users, Route as RouteIcon } from "lucide-react";
import type { CalculatorResult } from "@/lib/calculator";
import type { Passenger } from "@/components/calculator/calculator";
import type { GeoPoint } from "@/components/calculator/location-field";

const LocationMap = dynamic(
  () => import("@/components/calculator/location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  }
);

export function StepSummary({
  title,
  origin,
  destination,
  waypoints,
  distanceKm,
  isRoundTrip,
  consumptionL100,
  passengers,
  stopLabels,
  routePolyline,
  result,
  ticketLoading,
  ticketError,
  onGenerate,
}: {
  title: string;
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  waypoints: (GeoPoint | null)[];
  distanceKm: number;
  isRoundTrip: boolean;
  consumptionL100: number;
  passengers: Passenger[];
  stopLabels: string[];
  routePolyline: [number, number][];
  result: CalculatorResult;
  ticketLoading: boolean;
  ticketError: string;
  onGenerate: () => void;
}) {
  const shortOrigin = shortenAddress(origin?.label ?? "Origen");
  const shortDest = shortenAddress(destination?.label ?? "Destino");

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-4 overflow-y-auto pr-1 md:flex-row md:items-stretch">
      {/* Columna izquierda: Resumen A -> B y desglose */}
      <div className="flex flex-1 flex-col gap-3">
        {/* Banner ruta A -> B */}
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex flex-col min-w-0 mr-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {title.trim() ? "Viaje" : "Trayecto"}
            </span>
            {title.trim() ? (
              <>
                <h3 className="font-heading text-base font-semibold text-foreground truncate">
                  {title.trim()}
                </h3>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{shortOrigin}</span>
                  <ArrowRight size={12} className="text-primary shrink-0" />
                  <span>{shortDest}</span>
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                <span>{shortOrigin}</span>
                <ArrowRight size={16} className="text-primary shrink-0" />
                <span>{shortDest}</span>
              </div>
            )}
          </div>
          <span className="rounded-md bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary shrink-0">
            {distanceKm.toFixed(1)} km {isRoundTrip ? "· I/V" : ""}
          </span>
        </div>

        {/* Tarjeta de costes principales */}
        <Card className="border-border/60 bg-card/80">
          <CardContent className="space-y-3 p-4">
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <span className="text-xs text-muted-foreground">Coste total</span>
              <p className="text-2xl font-bold text-foreground">{result.totalCost.toFixed(2)} €</p>
            </div>

            {/* Desglose por pasajero — cada uno paga según el tramo que recorre */}
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={13} className="text-primary" /> Por pasajero
              </span>
              {passengers.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md bg-muted/20 px-2.5 py-1 text-sm"
                >
                  <span className="text-foreground">
                    {p.name.trim() || (i === 0 ? "Conductor" : `Persona ${i + 1}`)}
                    {stopLabels.length > 2 && (
                      <span className="ml-1.5 text-[11px] text-muted-foreground">
                        {stopLabels[p.pickupStop]} → {stopLabels[p.dropoffStop]}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-foreground">{(result.amounts[i] ?? 0).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Fuel size={13} className="text-primary" /> Consumo coche
                </span>
                <span className="font-medium text-foreground">{consumptionL100.toFixed(1)} l/100km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users size={13} className="text-primary" /> El conductor cobra de vuelta
                </span>
                <span className="font-semibold text-primary">{result.driverReceives.toFixed(2)} €</span>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full mt-2"
              disabled={ticketLoading}
              onClick={onGenerate}
            >
              {ticketLoading ? <Loader2 className="animate-spin" /> : <Receipt />}
              Generar ticket público
            </Button>
            {ticketError && <span className="text-xs text-destructive block text-center">{ticketError}</span>}
          </CardContent>
        </Card>
      </div>

      {/* Columna derecha: Mini mapa con la ruta trazada */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border/60 min-h-[220px]">
        <LocationMap stops={buildStops(origin, waypoints, destination)} routePolyline={routePolyline} />
      </div>
    </div>
  );
}
