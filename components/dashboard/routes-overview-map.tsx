"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useMemo, useRef } from "react";
import { Layers, Maximize2, Minimize2, Route } from "lucide-react";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import Link from "next/link";
import { MAP_STYLES, MapStyleKey } from "@/components/calculator/location-map";
import { buildMapsHref } from "@/lib/maps-link";
import { ExternalLink } from "lucide-react";

export interface UserTripRoute {
  id: string;
  shareId: string;
  title: string | null;
  origin: string;
  destination: string;
  distanceKm: number;
  totalCost: number;
  originLat?: number | null;
  originLon?: number | null;
  destLat?: number | null;
  destLon?: number | null;
  geometry?: string | null;
  waypoints?: { label: string; lat: number; lon: number }[];
}

const ROUTE_PALETTE = [
  { stroke: "#f97316", border: "#9a3412" }, // Naranja primario
  { stroke: "#3b82f6", border: "#1d4ed8" }, // Azul
  { stroke: "#10b981", border: "#047857" }, // Verde esmeralda
  { stroke: "#8b5cf6", border: "#6d28d9" }, // Violeta
  { stroke: "#ec4899", border: "#be185d" }, // Rosa
  { stroke: "#06b6d4", border: "#0e7490" }, // Cyan
  { stroke: "#eab308", border: "#a16207" }, // Amarillo
  { stroke: "#f43f5e", border: "#be123c" }, // Rojo carmín
];

function endpointPinIcon(color: string, label: string) {
  const svg = `<svg width="24" height="32" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="13" cy="12.5" r="5" fill="white"/></svg>`;
  const html = `<div style="position:relative;width:24px;height:32px;"><span class="map-pin-pulse" style="position:absolute;left:12px;top:12px;width:20px;height:20px;margin-left:-10px;margin-top:-10px;border-radius:9999px;background:${color};"></span>${svg}</div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [24, 32],
    iconAnchor: [12, 32],
  });
}

function RoutesMapController({
  allCoords,
  isFullscreen,
}: {
  allCoords: [number, number][];
  isFullscreen: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timeout);
  }, [map, isFullscreen]);

  useEffect(() => {
    map.invalidateSize();
    if (allCoords.length === 0) return;

    if (allCoords.length === 1) {
      map.flyTo(allCoords[0], 12);
      return;
    }

    const bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, allCoords]);

  return null;
}

export function RoutesOverviewMap({ trips }: { trips: UserTripRoute[] }) {
  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>("streets");
  const [openSelector, setOpenSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const styleConfig = MAP_STYLES[currentStyle];

  const parsedRoutes = useMemo(() => {
    return trips.map((trip, idx) => {
      let polyline: [number, number][] = [];
      if (trip.geometry) {
        try {
          polyline = JSON.parse(trip.geometry);
        } catch {
          polyline = [];
        }
      }

      // Si no hay geometría de OSRM pero hay lat/lon de origen y destino, fallback línea recta
      if (polyline.length === 0 && trip.originLat && trip.originLon && trip.destLat && trip.destLon) {
        polyline = [
          [trip.originLat, trip.originLon],
          ...(trip.waypoints?.map((w) => [w.lat, w.lon] as [number, number]) ?? []),
          [trip.destLat, trip.destLon],
        ];
      }

      const colorScheme = ROUTE_PALETTE[idx % ROUTE_PALETTE.length];

      const mapsHref =
        trip.originLat != null && trip.originLon != null && trip.destLat != null && trip.destLon != null
          ? buildMapsHref(
              { lat: trip.originLat, lon: trip.originLon },
              (trip.waypoints ?? []).map((w) => ({ lat: w.lat, lon: w.lon })),
              { lat: trip.destLat, lon: trip.destLon }
            )
          : null;

      return {
        ...trip,
        polyline,
        color: colorScheme,
        mapsHref,
      };
    });
  }, [trips]);

  const allCoords = useMemo(() => {
    const coords: [number, number][] = [];
    for (const route of parsedRoutes) {
      coords.push(...route.polyline);
    }
    return coords;
  }, [parsedRoutes]);

  const defaultCenter: [number, number] =
    allCoords.length > 0 ? allCoords[0] : [28.291564, -16.62913];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const validRoutesCount = parsedRoutes.filter((r) => r.polyline.length > 0).length;

  if (trips.length === 0 || validRoutesCount === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
        <Route className="mb-2 size-8 text-muted-foreground" />
        <p className="font-medium text-foreground text-sm">Sin datos de rutas</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tus viajes calculados aparecerán dibujados en este mapa.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] h-screen w-screen bg-background"
          : "relative h-[420px] w-full overflow-hidden rounded-2xl border border-border/60 shadow-sm"
      }
    >
      {/* Controles superiores derechos */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-wrap items-center justify-end gap-2">
        {/* Selector de capa */}
        <div className="relative flex flex-col items-end">
          <button
            type="button"
            onClick={() => setOpenSelector((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-md transition hover:bg-card"
          >
            <Layers size={14} className="text-primary" />
            <span>{styleConfig.name}</span>
          </button>

          {openSelector && (
            <div className="absolute right-0 top-9 mt-1 flex min-w-[120px] flex-col gap-1 rounded-lg border border-border/70 bg-card/95 p-1 shadow-lg backdrop-blur-md">
              {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => {
                const item = MAP_STYLES[key];
                const Icon = item.icon;
                const active = key === currentStyle;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setCurrentStyle(key);
                      setOpenSelector(false);
                    }}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition ${
                      active
                        ? "bg-primary font-medium text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pantalla completa */}
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/90 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-md transition hover:bg-card"
          title={isFullscreen ? "Salir de pantalla completa (Esc)" : "Pantalla completa"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 size={14} className="text-primary" />
              <span className="hidden sm:inline">Cerrar</span>
            </>
          ) : (
            <>
              <Maximize2 size={14} className="text-primary" />
              <span className="hidden sm:inline">Pantalla completa</span>
            </>
          )}
        </button>
      </div>

      {/* Leyenda flotante inferior izquierda */}
      <div className="absolute bottom-3 left-3 z-[1000] max-h-48 max-w-[280px] overflow-y-auto rounded-xl border border-border/70 bg-card/90 p-2.5 shadow-lg backdrop-blur-md sm:max-w-xs">
        <p className="mb-1.5 text-[11px] font-semibold text-foreground">
          Rutas registradas ({parsedRoutes.length})
        </p>
        <div className="flex flex-col gap-1">
          {parsedRoutes.map((r) => {
            const isSelected = selectedTripId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedTripId((prev) => (prev === r.id ? null : r.id))}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition ${
                  isSelected
                    ? "bg-muted font-medium text-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: r.color.stroke }}
                />
                <span className="truncate font-medium">
                  {r.title || `${r.origin} → ${r.destination}`}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                  {r.distanceKm} km
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={10}
        className="h-full w-full bg-muted/20"
      >
        <TileLayer
          key={currentStyle}
          attribution={styleConfig.attribution}
          url={styleConfig.url}
          subdomains={styleConfig.subdomains ?? "abc"}
          maxZoom={styleConfig.maxZoom}
        />

        <RoutesMapController allCoords={allCoords} isFullscreen={isFullscreen} />

        {parsedRoutes.map((route) => {
          if (route.polyline.length === 0) return null;
          const isSelected = selectedTripId === route.id;
          const hasSelection = selectedTripId !== null;
          const isFaded = hasSelection && !isSelected;

          const originPt = route.polyline[0];
          const destPt = route.polyline[route.polyline.length - 1];

          return (
            <div key={route.id}>
              {/* Borde / Halo */}
              <Polyline
                positions={route.polyline}
                pathOptions={{
                  color: isSelected ? "#ffffff" : route.color.border,
                  weight: isSelected ? 8 : 6,
                  opacity: isFaded ? 0.2 : 0.8,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              {/* Línea principal */}
              <Polyline
                positions={route.polyline}
                pathOptions={{
                  color: route.color.stroke,
                  weight: isSelected ? 5 : 4,
                  opacity: isFaded ? 0.3 : 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedTripId(route.id);
                  },
                }}
              />

              {/* Marcador Origen */}
              {originPt && (!hasSelection || isSelected) && (
                <Marker
                  position={originPt}
                  icon={endpointPinIcon(route.color.stroke, "O")}
                >
                  <Popup>
                    <div className="p-0.5 text-xs">
                      <p className="font-semibold text-foreground">{route.title || "Viaje"}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        <strong>Origen:</strong> {route.origin}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        <strong>Destino:</strong> {route.destination}
                      </p>
                      <p className="text-primary font-semibold text-[11px] mt-1">
                        {route.distanceKm} km · {route.totalCost.toFixed(2)} €
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <Link
                          href={`/t/${route.shareId}`}
                          className="flex-1 block text-center rounded bg-primary py-1 px-2 text-[11px] font-medium text-primary-foreground hover:opacity-90"
                        >
                          Ver ticket
                        </Link>
                        {route.mapsHref && (
                          <a
                            href={route.mapsHref}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-1 items-center justify-center gap-1 rounded border border-border/70 py-1 px-2 text-[11px] font-medium text-foreground hover:bg-muted"
                          >
                            <ExternalLink size={11} />
                            Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Marcador Destino */}
              {destPt && (!hasSelection || isSelected) && (
                <Marker
                  position={destPt}
                  icon={endpointPinIcon(route.color.stroke, "D")}
                >
                  <Popup>
                    <div className="p-0.5 text-xs">
                      <p className="font-semibold text-foreground">{route.title || "Viaje"}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        <strong>Destino:</strong> {route.destination}
                      </p>
                      <p className="text-primary font-semibold text-[11px] mt-1">
                        {route.distanceKm} km · {route.totalCost.toFixed(2)} €
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <Link
                          href={`/t/${route.shareId}`}
                          className="flex-1 block text-center rounded bg-primary py-1 px-2 text-[11px] font-medium text-primary-foreground hover:opacity-90"
                        >
                          Ver ticket
                        </Link>
                        {route.mapsHref && (
                          <a
                            href={route.mapsHref}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-1 items-center justify-center gap-1 rounded border border-border/70 py-1 px-2 text-[11px] font-medium text-foreground hover:bg-muted"
                          >
                            <ExternalLink size={11} />
                            Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
