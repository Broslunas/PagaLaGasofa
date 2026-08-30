"use client";

import { Button } from "@/components/ui/button";
import { buildMapsHref, type LatLon } from "@/lib/maps-link";
import { Route } from "lucide-react";

export function OpenMapsButton({
  origin,
  destination,
  waypoints,
}: {
  origin: LatLon;
  destination: LatLon;
  waypoints: LatLon[];
}) {
  const href = buildMapsHref(origin, waypoints, destination);
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={href} target="_blank" rel="noreferrer" />}
    >
      <Route />
      Abrir ruta en Maps
    </Button>
  );
}
