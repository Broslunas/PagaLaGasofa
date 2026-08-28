"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocationField, type GeoPoint } from "@/components/calculator/location-field";
import { buildStops } from "@/lib/stops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Route, X } from "lucide-react";

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
  title,
  onTitleChange,
  origin,
  destination,
  waypoints,
  onOriginChange,
  onDestinationChange,
  onWaypointsChange,
  distanceKm,
  setDistanceKm,
  routePolyline,
  distanceLoading,
  distanceError,
  onRetryDistance,
}: {
  title: string;
  onTitleChange: (s: string) => void;
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  waypoints: (GeoPoint | null)[];
  onOriginChange: (p: GeoPoint | null) => void;
  onDestinationChange: (p: GeoPoint | null) => void;
  onWaypointsChange: (waypoints: (GeoPoint | null)[]) => void;
  distanceKm: number;
  setDistanceKm: (n: number) => void;
  routePolyline: [number, number][];
  distanceLoading: boolean;
  distanceError: string;
  onRetryDistance: () => void;
}) {
  // 0 = origen, 1..N = paradas, N+1 = destino
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  function handlePick(index: number, point: GeoPoint) {
    if (index === 0) onOriginChange(point);
    else if (index === waypoints.length + 1) onDestinationChange(point);
    else onWaypointsChange(waypoints.map((w, i) => (i === index - 1 ? point : w)));
  }

  function addWaypoint() {
    onWaypointsChange([...waypoints, null]);
    setActiveStopIndex(waypoints.length + 1);
  }
  function removeWaypoint(i: number) {
    onWaypointsChange(waypoints.filter((_, idx) => idx !== i));
    setActiveStopIndex(0);
  }

  const dest = { index: waypoints.length + 1, label: "Destino" };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 md:flex-row">
      <div className="flex shrink-0 flex-col gap-3 overflow-y-auto md:w-80">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trip-title">Nombre del viaje (opcional)</Label>
          <Input
            id="trip-title"
            type="text"
            placeholder="p.ej. Escapada a la playa, Festival..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <LocationField
          id="origin"
          label="Origen"
          value={origin}
          onChange={onOriginChange}
          onFocus={() => setActiveStopIndex(0)}
          active={activeStopIndex === 0}
        />

        {waypoints.map((point, i) => (
          <div key={i} className="flex items-end gap-1.5">
            <div className="flex-1">
              <LocationField
                id={`waypoint-${i}`}
                label={`Parada ${i + 1}`}
                value={point}
                onChange={(p) => onWaypointsChange(waypoints.map((w, idx) => (idx === i ? p : w)))}
                onFocus={() => setActiveStopIndex(i + 1)}
                active={activeStopIndex === i + 1}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Quitar parada"
              onClick={() => removeWaypoint(i)}
            >
              <X />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addWaypoint}>
          <Plus />
          Añadir parada
        </Button>

        <LocationField
          id="destination"
          label="Destino"
          value={destination}
          onChange={onDestinationChange}
          onFocus={() => setActiveStopIndex(dest.index)}
          active={activeStopIndex === dest.index}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="distanceKm">Distancia por carretera (km)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="distanceKm"
              type="number"
              min={0}
              value={distanceKm}
              disabled={waypoints.length > 0}
              title={waypoints.length > 0 ? "Con paradas, la distancia se calcula automáticamente" : undefined}
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
          stops={buildStops(origin, waypoints, destination)}
          routePolyline={routePolyline}
          activeStopIndex={activeStopIndex}
          onPick={handlePick}
        />
      </div>
    </div>
  );
}
