"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { shortenAddress } from "@/lib/format-address";
import { ArrowRight, Fuel, Loader2, Receipt, Users, Route as RouteIcon } from "lucide-react";
import type { CalculatorResult } from "@/lib/calculator";
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
  origin,
  destination,
  distanceKm,
  isRoundTrip,
  consumptionL100,
  passengerNames,
  routePolyline,
  result,
  ticketLoading,
  ticketError,
  onGenerate,
}: {
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  distanceKm: number;
  isRoundTrip: boolean;
  consumptionL100: number;
  passengerNames: string[];
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
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Trayecto
            </span>
            <div className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
              <span>{shortOrigin}</span>
              <ArrowRight size={16} className="text-primary shrink-0" />
              <span>{shortDest}</span>
            </div>
          </div>
          <span className="rounded-md bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
            {distanceKm} km {isRoundTrip ? "· I/V" : ""}
          </span>
        </div>

        {/* Tarjeta de costes principales */}
        <Card className="border-border/60 bg-card/80">
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-center">
              <div>
                <span className="text-xs text-muted-foreground">Coste total</span>
                <p className="text-2xl font-bold text-foreground">
                  {result.totalCost.toFixed(2)} €
                </p>
              </div>
              <div className="border-l border-border/60">
                <span className="text-xs text-muted-foreground">
                  Por persona ({passengerNames.length})
                </span>
                <p className="text-2xl font-bold text-primary">
                  {result.costPerPassenger.toFixed(2)} €
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Fuel size={13} className="text-primary" /> Consumo coche
                </span>
                <span className="font-medium text-foreground">{consumptionL100} l/100km</span>
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
        <LocationMap
          origin={origin}
          destination={destination}
          routePolyline={routePolyline}
          activeField="origin"
          onPick={() => {}}
        />
      </div>
    </div>
  );
}
