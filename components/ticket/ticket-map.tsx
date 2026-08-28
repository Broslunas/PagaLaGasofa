"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { type GeoPoint } from "@/components/calculator/location-field";

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

export function TicketMap({
  originLabel,
  destinationLabel,
  originLat,
  originLon,
  destLat,
  destLon,
  geometry,
}: {
  originLabel: string;
  destinationLabel: string;
  originLat?: number | null;
  originLon?: number | null;
  destLat?: number | null;
  destLon?: number | null;
  geometry?: string | null;
}) {
  const origin: GeoPoint = useMemo(
    () => ({
      label: originLabel,
      lat: originLat ?? 28.4636,
      lon: originLon ?? -16.2518,
    }),
    [originLabel, originLat, originLon]
  );

  const destination: GeoPoint = useMemo(
    () => ({
      label: destinationLabel,
      lat: destLat ?? 28.4158,
      lon: destLon ?? -16.5517,
    }),
    [destinationLabel, destLat, destLon]
  );

  const routePolyline: [number, number][] = useMemo(() => {
    if (!geometry) return [];
    try {
      return JSON.parse(geometry);
    } catch {
      return [];
    }
  }, [geometry]);

  return (
    <div className="h-full min-h-[300px] w-full overflow-hidden rounded-2xl border border-border/60 shadow-sm">
      <LocationMap
        origin={origin}
        destination={destination}
        routePolyline={routePolyline}
        activeField="origin"
        onPick={() => {}}
      />
    </div>
  );
}
