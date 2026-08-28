"use client";

import dynamic from "next/dynamic";
import type { UserTripRoute } from "@/components/dashboard/routes-overview-map";

const RoutesOverviewMap = dynamic(
  () =>
    import("@/components/dashboard/routes-overview-map").then(
      (m) => m.RoutesOverviewMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl border border-border/60 bg-muted/20 text-xs text-muted-foreground">
        Cargando mapa de rutas…
      </div>
    ),
  }
);

export function DashboardRoutesMap({ trips }: { trips: UserTripRoute[] }) {
  return <RoutesOverviewMap trips={trips} />;
}
