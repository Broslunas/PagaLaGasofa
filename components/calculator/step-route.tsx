"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocationField, type GeoPoint } from "@/components/calculator/location-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Route } from "lucide-react";

const LocationMap = dynamic(
  () => import("@/components/calculator/location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  }
);

const numberField = (v: string) => (v === "" ? 0 : Number(v));

export function StepRoute({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  distanceKm,
  setDistanceKm,
  routePolyline,
  distanceLoading,
  distanceError,
  onRetryDistance,
}: {
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  onOriginChange: (p: GeoPoint | null) => void;
  onDestinationChange: (p: GeoPoint | null) => void;
  distanceKm: number;
  setDistanceKm: (n: number) => void;
  routePolyline: [number, number][];
  distanceLoading: boolean;
  distanceError: string;
  onRetryDistance: () => void;
}) {
  const [activeField, setActiveField] = useState<"origin" | "destination">("origin");

  function handlePick(field: "origin" | "destination", point: GeoPoint) {
    if (field === "origin") onOriginChange(point);
    else onDestinationChange(point);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 md:flex-row">
      <div className="flex shrink-0 flex-col gap-3 md:w-80">
        <LocationField
          id="origin"
          label="Origen"
          value={origin}
          onChange={onOriginChange}
          onFocus={() => setActiveField("origin")}
          active={activeField === "origin"}
        />
        <LocationField
          id="destination"
          label="Destino"
          value={destination}
          onChange={onDestinationChange}
          onFocus={() => setActiveField("destination")}
          active={activeField === "destination"}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="distanceKm">Distancia por carretera (km)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="distanceKm"
              type="number"
              min={0}
              value={distanceKm}
              onChange={(e) => setDistanceKm(numberField(e.target.value))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Recalcular ruta en coche"
              disabled={!origin || !destination || distanceLoading}
              onClick={onRetryDistance}
            >
              {distanceLoading ? <Loader2 className="animate-spin" /> : <Route />}
            </Button>
          </div>
          {distanceLoading && (
            <span className="text-xs text-muted-foreground">Calculando ruta en coche…</span>
          )}
          {distanceError && <span className="text-xs text-destructive">{distanceError}</span>}
        </div>

        <p className="text-xs text-muted-foreground">
          Escribe una dirección, toca el mapa sobre el campo activo o usa tu ubicación actual.
        </p>
      </div>

      <div className="min-h-40 flex-1 overflow-hidden rounded-lg border">
        <LocationMap
          origin={origin}
          destination={destination}
          routePolyline={routePolyline}
          activeField={activeField}
          onPick={handlePick}
        />
      </div>
    </div>
  );
}
