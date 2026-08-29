"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Layers, Sun, Mountain, Satellite, Maximize2, Minimize2, MapPin, Plus } from "lucide-react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { GeoPoint } from "@/components/calculator/location-field";
import type { MapStop } from "@/lib/stops";

// Centrado en Tenerife (Santa Cruz / La Laguna / Teide)
const TENERIFE_CENTER: [number, number] = [28.291564, -16.62913];

export type MapStyleKey = "streets" | "satellite" | "terrain";

export const MAP_STYLES: Record<
  MapStyleKey,
  {
    name: string;
    icon: typeof Sun;
    url: string;
    subdomains?: string;
    maxZoom: number;
    attribution: string;
    routeColor: string;
    routeBorderColor: string;
  }
> = {
  streets: {
    name: "Estándar",
    icon: Sun,
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    routeColor: "#ea580c",
    routeBorderColor: "#7c2d12",
  },
  satellite: {
    name: "Satélite",
    icon: Satellite,
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19,
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    routeColor: "#fb923c",
    routeBorderColor: "#000000",
  },
  terrain: {
    name: "Relieve",
    icon: Mountain,
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    maxZoom: 17,
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    routeColor: "#ea580c",
    routeBorderColor: "#431407",
  },
};

function pinIcon(color: string, label: string) {
  const svg = `<svg width="44" height="58" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="13" cy="12.5" r="8" fill="white"/><text x="13" y="16.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="${color}">${label}</text></svg>`;
  const html = `<div style="position:relative;width:44px;height:58px;"><span class="map-pin-pulse" style="position:absolute;left:22px;top:21px;width:34px;height:34px;margin-left:-17px;margin-top:-17px;border-radius:9999px;background:${color};"></span>${svg}</div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [44, 58],
    iconAnchor: [22, 58],
  });
}

const STATION_COLORS = {
  cheap: "#16a34a", // de las más baratas de la ruta
  close: "#2563eb", // muy pegada a la ruta, casi sin desvío
  default: "#ea580c",
} as const;

// Badge con el precio para puntos de interés seleccionables (p.ej. gasolineras),
// distinto de los pines grandes de origen/parada/destino (pinIcon). Relleno verde
// con check si ya está seleccionado como parada; si no, borde de color según
// colorKind (verde = barata, azul = cerca de la ruta, naranja = resto).
// ponytail: sin puntero apuntando al punto exacto (simple badge centrado); si hace
// falta más precisión visual, añadir una punta triangular al div.
function stationIcon(selected: boolean, priceLabel: string, colorKind: keyof typeof STATION_COLORS) {
  const accent = STATION_COLORS[colorKind];
  const bg = selected ? "#16a34a" : "#ffffff";
  const fg = selected ? "#ffffff" : accent;
  const border = selected ? "#16a34a" : accent;
  const label = selected ? `✓ ${priceLabel}` : priceLabel;
  const width = 16 + label.length * 6.5;
  const html = `<div style="display:flex;align-items:center;justify-content:center;height:20px;padding:0 6px;border-radius:9999px;background:${bg};border:2px solid ${border};box-shadow:0 1px 4px rgba(0,0,0,.4);font:700 11px system-ui,sans-serif;color:${fg};white-space:nowrap;">${label}</div>`;
  return L.divIcon({ html, className: "", iconSize: [width, 20], iconAnchor: [width / 2, 10] });
}

export interface MapStationMarker {
  id: string;
  lat: number;
  lon: number;
  title: string;
  priceLabel: string;
  colorKind: keyof typeof STATION_COLORS;
  selected: boolean;
  onClick: () => void;
}

function MapController({
  points,
  routePolyline,
  isFullscreen,
}: {
  points: GeoPoint[];
  routePolyline: [number, number][];
  isFullscreen: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(id);
  }, [map, isFullscreen]);

  useEffect(() => {
    if (routePolyline.length > 0) {
      map.fitBounds(L.latLngBounds(routePolyline), { padding: [40, 40], maxZoom: 14 });
    } else if (points.length > 1) {
      map.fitBounds(
        points.map((p) => [p.lat, p.lon] as [number, number]),
        { padding: [40, 40], maxZoom: 14 }
      );
    } else if (points.length === 1) {
      map.flyTo([points[0].lat, points[0].lon], 13);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points.map((p) => [p.lat, p.lon])), routePolyline]);

  return null;
}

function ClickHandler({ onPick }: { onPick: (point: GeoPoint) => void }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const provisional: GeoPoint = { label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lon: lng };
      onPick(provisional);
      try {
        const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
        if (res.ok) onPick(await res.json());
      } catch {
        // se queda con el label provisional de lat/lon
      }
    },
  });
  return null;
}

export function LocationMap({
  stops,
  routePolyline = [],
  activeStopIndex = -1,
  onSelectStopIndex,
  onAddWaypoint,
  onPick,
  stationMarkers = [],
}: {
  stops: MapStop[];
  routePolyline?: [number, number][];
  /** Índice del stop que recibe el próximo clic en el mapa. -1 = mapa de solo lectura. */
  activeStopIndex?: number;
  onSelectStopIndex?: (index: number) => void;
  onAddWaypoint?: () => void;
  onPick?: (index: number, point: GeoPoint) => void;
  /** Puntos de interés seleccionables aparte de los stops de la ruta (p.ej. gasolineras cercanas). */
  stationMarkers?: MapStationMarker[];
}) {
  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>("streets");
  const [openSelector, setOpenSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const styleConfig = MAP_STYLES[currentStyle];
  const points = stops.map((s) => s.point).filter((p): p is GeoPoint => p !== null);
  const interactive = !!onPick && activeStopIndex >= 0;

  const getStopTitle = (index: number) => {
    if (index === 0) return "Origen";
    if (index === stops.length - 1) return "Destino";
    return `Parada ${index}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] h-screen w-screen bg-background"
          : "relative h-full w-full"
      }
    >
      {/* Controles superiores derechos: Selector de capas y Pantalla completa */}
      <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5">
        <div className="relative flex flex-col items-end">
          <button
            type="button"
            onClick={() => setOpenSelector((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-md transition hover:bg-card"
            title="Cambiar tipo de mapa"
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

      {/* Leyenda inferior izquierda (solo en fullscreen) */}
      {isFullscreen && (
        <div className="absolute bottom-3 left-3 z-[1000] max-h-[45vh] max-w-[280px] overflow-y-auto rounded-xl border border-border/70 bg-card/90 p-2.5 shadow-lg backdrop-blur-md sm:max-w-xs">
          <div className="mb-2 flex items-center justify-between gap-1 border-b border-border/50 pb-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin size={12} className="text-primary" />
              <span>Leyenda</span>
            </div>
            {onAddWaypoint && (
              <button
                type="button"
                onClick={onAddWaypoint}
                className="flex items-center gap-1 rounded-md border border-border/70 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
                title="Añadir parada intermedia"
              >
                <Plus size={11} className="text-primary" />
                <span>Añadir parada</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {stops.map((stop, i) => {
              const isTarget = interactive && activeStopIndex === i;
              const title = getStopTitle(i);
              const canSelect = interactive && !!onSelectStopIndex;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={!canSelect}
                  onClick={() => onSelectStopIndex?.(i)}
                  className={`flex w-full items-center gap-2 rounded-md p-1.5 text-left text-xs transition ${
                    isTarget
                      ? "border border-primary/40 bg-primary/10 font-medium text-primary shadow-sm"
                      : canSelect
                        ? "text-foreground hover:bg-muted/60"
                        : "text-foreground"
                  }`}
                  title={canSelect ? `Seleccionar para fijar ${title}` : undefined}
                >
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: stop.color }}
                  >
                    {stop.label}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-semibold">{title}</span>
                      {isTarget && (
                        <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold uppercase text-primary">
                          Fijando
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {stop.point ? stop.point.label : "Sin seleccionar (click para fijar)"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {interactive && (
            <p className="mt-2 border-t border-border/50 pt-1.5 text-[10px] text-muted-foreground">
              Haz clic en un punto de la leyenda para cambiarlo o toca el mapa para fijar <strong>{getStopTitle(activeStopIndex)}</strong>.
            </p>
          )}
        </div>
      )}

      <MapContainer
        center={TENERIFE_CENTER}
        zoom={10}
        className="h-full w-full rounded-lg bg-muted/20"
      >
        <TileLayer
          key={currentStyle}
          attribution={styleConfig.attribution}
          url={styleConfig.url}
          subdomains={styleConfig.subdomains ?? "abc"}
          maxZoom={styleConfig.maxZoom}
        />
        {stops.map(
          (stop, i) =>
            stop.point && (
              <Marker key={i} position={[stop.point.lat, stop.point.lon]} icon={pinIcon(stop.color, stop.label)} />
            )
        )}

        {stationMarkers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lon]}
            icon={stationIcon(m.selected, m.priceLabel, m.colorKind)}
            title={m.title}
            eventHandlers={{ click: m.onClick }}
          />
        ))}

        {/* Línea de ruta naranja adaptada al estilo */}
        {routePolyline.length > 0 && (
          <>
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: styleConfig.routeBorderColor,
                weight: 7,
                opacity: 0.8,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: styleConfig.routeColor,
                weight: 5,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        <MapController points={points} routePolyline={routePolyline} isFullscreen={isFullscreen} />
        {interactive && <ClickHandler onPick={(point) => onPick!(activeStopIndex, point)} />}
      </MapContainer>
    </div>
  );
}
