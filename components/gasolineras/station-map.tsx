"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Layers, Sun, Mountain, Satellite } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { MAP_STYLES, MapStyleKey } from "@/components/calculator/location-map";

function stationPinIcon(name: string) {
  const svg = `<svg width="46" height="60" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="#ea580c" stroke="white" stroke-width="1.5"/><circle cx="13" cy="12.5" r="8" fill="white"/><text x="13" y="16.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ea580c">⛽</text></svg>`;
  const html = `<div style="position:relative;width:46px;height:60px;"><span class="map-pin-pulse" style="position:absolute;left:23px;top:22px;width:36px;height:36px;margin-left:-18px;margin-top:-18px;border-radius:9999px;background:#ea580c;"></span>${svg}</div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [46, 60],
    iconAnchor: [23, 60],
  });
}

function MapCenterController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.flyTo([lat, lng], 15);
  }, [map, lat, lng]);
  return null;
}

export default function StationMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>("streets");
  const [openSelector, setOpenSelector] = useState(false);
  const styleConfig = MAP_STYLES[currentStyle];

  return (
    <div className="relative h-full w-full">
      {/* Selector de capas */}
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
        center={[lat, lng]}
        zoom={15}
        className="h-full w-full rounded-2xl bg-muted/20"
      >
        <TileLayer
          key={currentStyle}
          attribution={styleConfig.attribution}
          url={styleConfig.url}
          subdomains={styleConfig.subdomains ?? "abc"}
          maxZoom={styleConfig.maxZoom}
        />
        <Marker position={[lat, lng]} icon={stationPinIcon(name)} />
        <MapCenterController lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
