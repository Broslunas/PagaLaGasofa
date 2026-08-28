import type { GeoPoint } from "@/components/calculator/location-field";

// Un "stop" es un punto de la ruta: origen, una parada intermedia o el destino.
export interface MapStop {
  point: GeoPoint | null;
  label: string;
  color: string;
}

const WAYPOINT_COLOR = "#3b82f6";

// Construye la lista ordenada de stops [origen, ...paradas, destino] con
// etiquetas/colores consistentes — usado por el formulario, el resumen y el
// ticket público para no duplicar esta lógica en cada sitio.
export function buildStops(origin: GeoPoint | null, waypoints: (GeoPoint | null)[], destination: GeoPoint | null): MapStop[] {
  return [
    { point: origin, label: "A", color: "#22c55e" },
    ...waypoints.map((point, i) => ({ point, label: String(i + 1), color: WAYPOINT_COLOR })),
    { point: destination, label: "B", color: "#ef4444" },
  ];
}
