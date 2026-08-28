"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Layers, Sun, Mountain, Satellite } from "lucide-react";
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

function MapController({
  points,
  routePolyline,
}: {
  points: GeoPoint[];
  routePolyline: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(id);
  }, [map]);

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
  onPick,
}: {
  stops: MapStop[];
  routePolyline?: [number, number][];
  /** Índice del stop que recibe el próximo clic en el mapa. -1 = mapa de solo lectura. */
  activeStopIndex?: number;
  onPick?: (index: number, point: GeoPoint) => void;
}) {
  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>("streets");
  const [openSelector, setOpenSelector] = useState(false);

  const styleConfig = MAP_STYLES[currentStyle];
  const points = stops.map((s) => s.point).filter((p): p is GeoPoint => p !== null);
  const interactive = !!onPick && activeStopIndex >= 0;

  return (
    <div className="relative h-full w-full">
      {/* Selector de capas / estilos de mapa */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col items-end">
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
          <div className="mt-1 flex flex-col gap-1 rounded-lg border border-border/70 bg-card/95 p-1 shadow-lg backdrop-blur-md">
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
                      ? "bg-primary text-primary-foreground font-medium"
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

        <MapController points={points} routePolyline={routePolyline} />
        {interactive && <ClickHandler onPick={(point) => onPick!(activeStopIndex, point)} />}
      </MapContainer>
    </div>
  );
}
