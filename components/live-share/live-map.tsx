"use client";

// Primitiva Leaflet mínima — no LocationMap: aquí solo hace falta un punto que
// se mueve, sin selector de capas ni edición de paradas. Debe importarse solo
// vía next/dynamic({ssr:false}) desde un componente "use client" (ver
// live-viewer.tsx), igual que TicketMap hace con LocationMap.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

const pin = L.divIcon({
  html: '<div style="width:20px;height:20px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px rgba(37,99,235,0.4)"></div>',
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapCenterController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom() < 13 ? 15 : map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export function LiveMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer center={[lat, lng]} zoom={15} className="h-full w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Marker position={[lat, lng]} icon={pin} />
      <MapCenterController lat={lat} lng={lng} />
    </MapContainer>
  );
}
