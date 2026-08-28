"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useMemo, useRef } from "react";
import { Layers, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import Link from "next/link";
import { MAP_STYLES, MapStyleKey } from "@/components/calculator/location-map";

export interface MapStationItem {
  id: string;
  name: string;
  brand: string;
  address: string;
  municipality: string;
  lat: number;
  lng: number;
  price: number | null;
  isCheapest?: boolean;
}

function createPriceMarker(price: number | null, isCheapest: boolean, isMini: boolean) {
  const priceText = price ? `${price.toFixed(3)}€` : "N/D";

  if (isMini) {
    const dotBg = isCheapest ? "#10b981" : "#f97316";
    const miniHtml = `
      <div style="
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(-50%, -50%);
        width: 11px;
        height: 11px;
        border-radius: 9999px;
        background: ${dotBg};
        border: 2px solid #ffffff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: transform 0.15s ease;
      "></div>
    `;
    return L.divIcon({
      html: miniHtml,
      className: "custom-gas-marker mini-marker",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  const bg = isCheapest
    ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
    : "linear-gradient(135deg, #1f2937 0%, #111827 100%)";
  const borderColor = isCheapest ? "#34d399" : "rgba(255,255,255,0.18)";
  const iconColor = isCheapest ? "#a7f3d0" : "#fb923c";
  const shadow = isCheapest
    ? "0 4px 14px -1px rgba(5,150,105,0.5), 0 2px 5px rgba(0,0,0,0.3)"
    : "0 4px 12px -1px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.25)";
  const tipColor = isCheapest ? "#047857" : "#111827";

  const svgFuel = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
      <path d="M3 22h12"/>
      <path d="M4 9h10"/>
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/>
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>
    </svg>
  `;

  const html = `
    <div style="
      position: absolute;
      left: 0;
      top: 0;
      transform: translate(-50%, -100%);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      pointer-events: auto;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    ">
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px 3px 6px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        background: ${bg};
        color: #ffffff;
        border: 1px solid ${borderColor};
        box-shadow: ${shadow};
        white-space: nowrap;
        user-select: none;
      ">
        ${svgFuel}
        <span style="letter-spacing: -0.02em;">${priceText}</span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid ${tipColor};
        margin-top: -1px;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-gas-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapViewController({
  stations,
  isFullscreen,
  onZoomChange,
}: {
  stations: MapStationItem[];
  isFullscreen: boolean;
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
    zoom: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timeout);
  }, [map, isFullscreen]);

  useEffect(() => {
    map.invalidateSize();
    const valid = stations.filter((s) => s.lat !== 0 && s.lng !== 0);
    if (valid.length === 0) return;

    if (valid.length === 1) {
      map.flyTo([valid[0].lat, valid[0].lng], 13);
      onZoomChange(13);
      return;
    }

    const bounds = L.latLngBounds(valid.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    const fitZoom = map.getBoundsZoom(bounds);
    onZoomChange(fitZoom);
  }, [map, stations, onZoomChange]);

  return null;
}

export default function GasStationsOverviewMap({
  stations,
  fuelLabel,
  provinceId,
}: {
  stations: MapStationItem[];
  fuelLabel: string;
  provinceId: string;
}) {
  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>("streets");
  const [openSelector, setOpenSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [onlyCheapest, setOnlyCheapest] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const styleConfig = MAP_STYLES[currentStyle];

  const validStations = useMemo(
    () => stations.filter((s) => s.lat !== 0 && s.lng !== 0),
    [stations]
  );

  // Ordenar por precio para destacar las mejores
  const rankedStationIds = useMemo(() => {
    const sorted = [...validStations]
      .filter((s) => s.price !== null && s.price > 0)
      .sort((a, b) => (a.price ?? 999) - (b.price ?? 999));
    return new Set(sorted.slice(0, 15).map((s) => s.id));
  }, [validStations]);

  const displayedStations = useMemo(() => {
    if (onlyCheapest) {
      return validStations.filter((s) => rankedStationIds.has(s.id));
    }
    return validStations;
  }, [validStations, onlyCheapest, rankedStationIds]);

  const defaultCenter: [number, number] =
    validStations.length > 0
      ? [validStations[0].lat, validStations[0].lng]
      : [40.4168, -3.7038];

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
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
      ref={containerRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] h-screen w-screen bg-background"
          : "relative h-full w-full"
      }
    >
      {/* Map Control Buttons (Top Right) */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-wrap items-center justify-end gap-2">
        {/* Toggle Top Cheapest */}
        <button
          type="button"
          onClick={() => setOnlyCheapest((prev) => !prev)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-md backdrop-blur-md transition ${
            onlyCheapest
              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              : "border-border/70 bg-card/90 text-foreground hover:bg-card"
          }`}
          title="Ver solo las 15 más baratas para no saturar el mapa"
        >
          <Sparkles size={13} className={onlyCheapest ? "text-emerald-400" : "text-amber-500"} />
          <span>{onlyCheapest ? "Top 15 Baratas" : "Ver todas"}</span>
        </button>

        {/* Layer Selector */}
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
            <div className="absolute right-0 top-9 mt-1 flex flex-col gap-1 rounded-lg border border-border/70 bg-card/95 p-1 shadow-lg backdrop-blur-md min-w-[120px]">
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

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
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

      <MapContainer
        center={defaultCenter}
        zoom={11}
        className="h-full w-full rounded-2xl bg-muted/20"
      >
        <TileLayer
          key={currentStyle}
          attribution={styleConfig.attribution}
          url={styleConfig.url}
          subdomains={styleConfig.subdomains ?? "abc"}
          maxZoom={styleConfig.maxZoom}
        />

        <MapViewController
          stations={validStations}
          isFullscreen={isFullscreen}
          onZoomChange={setZoomLevel}
        />

        {displayedStations.map((s) => {
          const isTopRanked = rankedStationIds.has(s.id);
          // En zoom bajo (< 12) y mostrando todas, solo top 15 llevan badge grande, el resto punto compacto
          const isMini = !onlyCheapest && zoomLevel < 12 && !isTopRanked;

          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              zIndexOffset={s.isCheapest ? 2000 : isTopRanked ? 1000 : 100}
              icon={createPriceMarker(s.price, Boolean(s.isCheapest), isMini)}
            >
              <Popup className="station-popup">
                <div className="p-0.5 text-xs min-w-[190px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold uppercase text-[10px] text-zinc-400">
                      {s.brand}
                    </span>
                    {s.isCheapest && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                        MÁS BARATO
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-sm text-zinc-100 leading-snug mt-1 line-clamp-1">
                    {s.name}
                  </p>
                  <p className="text-zinc-400 mt-0.5 text-[11px] line-clamp-2">
                    {s.address}, {s.municipality}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between border-t border-zinc-800 pt-2">
                    <span className="text-[11px] text-zinc-300">
                      {fuelLabel}:
                    </span>
                    <span className="font-extrabold text-sm text-amber-500">
                      {s.price ? `${s.price.toFixed(3)} €/L` : "N/D"}
                    </span>
                  </div>

                  <Link
                    href={`/gasolineras/${s.id}?provincia=${provinceId}`}
                    className="mt-3 block text-center rounded-lg bg-amber-600 hover:bg-amber-500 py-1.5 px-3 text-xs font-semibold text-white transition-colors"
                  >
                    Ver ficha completa
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
