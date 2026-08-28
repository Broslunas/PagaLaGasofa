"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useMemo } from "react";
import { Layers } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
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

function createPriceMarker(price: number | null, isCheapest: boolean) {
  const priceText = price ? `${price.toFixed(3)}€` : "N/D";
  const bgClass = isCheapest
    ? "background: #059669; color: #ffffff; border-color: #34d399;"
    : "background: #18181b; color: #f4f4f5; border-color: #f97316;";

  const html = `
    <div style="
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 6px;
      border-radius: 9999px;
      font-family: system-ui, sans-serif;
      font-size: 11px;
      font-weight: 700;
      border: 1.5px solid;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4);
      white-space: nowrap;
      cursor: pointer;
      transform: translate(-50%, -50%);
      ${bgClass}
    ">
      <span>⛽</span>
      <span>${priceText}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "gas-price-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapBoundsController({ stations }: { stations: MapStationItem[] }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const valid = stations.filter((s) => s.lat !== 0 && s.lng !== 0);
    if (valid.length === 0) return;

    if (valid.length === 1) {
      map.flyTo([valid[0].lat, valid[0].lng], 13);
      return;
    }

    const bounds = L.latLngBounds(valid.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, stations]);

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
  const styleConfig = MAP_STYLES[currentStyle];

  const validStations = useMemo(
    () => stations.filter((s) => s.lat !== 0 && s.lng !== 0),
    [stations]
  );

  const defaultCenter: [number, number] =
    validStations.length > 0
      ? [validStations[0].lat, validStations[0].lng]
      : [40.4168, -3.7038];

  return (
    <div className="relative h-full w-full">
      {/* Map Layer Selector */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col items-end">
        <button
          type="button"
          onClick={() => setOpenSelector((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-md transition hover:bg-card"
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

        <MapBoundsController stations={validStations} />

        {validStations.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={createPriceMarker(s.price, Boolean(s.isCheapest))}
          >
            <Popup className="station-popup">
              <div className="p-1 text-xs">
                <span className="font-bold uppercase text-[10px] text-muted-foreground">
                  {s.brand}
                </span>
                <p className="font-bold text-sm text-foreground leading-snug">
                  {s.name}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {s.address}, {s.municipality}
                </p>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    {fuelLabel}:
                  </span>
                  <span className="font-extrabold text-primary">
                    {s.price ? `${s.price.toFixed(3)} €/L` : "N/D"}
                  </span>
                </div>
                <Link
                  href={`/gasolineras/${s.id}?provincia=${provinceId}`}
                  className="mt-2.5 block text-center rounded-md bg-primary py-1 px-2 text-[11px] font-bold text-primary-foreground hover:opacity-90 transition"
                >
                  Ver ficha completa
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
