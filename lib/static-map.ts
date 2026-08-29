// Mapa "estático" real para el OG image: satori (usado por ImageResponse) no
// soporta canvas/WebGL como el Leaflet interactivo (components/calculator/location-map.tsx),
// así que componemos tiles rasterizados de OpenStreetMap con proyección Web
// Mercator y los pintamos como <img> absolutos + una <svg> con la ruta encima.
const TILE_SIZE = 256;

function lonToX(lon: number, zoom: number) {
  return ((lon + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

function latToY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * TILE_SIZE * 2 ** zoom;
}

type Bounds = { minLat: number; maxLat: number; minLon: number; maxLon: number };

function fitZoom(bounds: Bounds, width: number, height: number, padding: number, maxZoom: number) {
  for (let z = maxZoom; z >= 2; z--) {
    const w = lonToX(bounds.maxLon, z) - lonToX(bounds.minLon, z);
    const h = latToY(bounds.minLat, z) - latToY(bounds.maxLat, z);
    if (w <= width - padding * 2 && h <= height - padding * 2) return z;
  }
  return 2;
}

type RoutePoint = { lat: number; lon: number };

/** Puntos de la ruta a pintar: la polilínea real de OSRM (trip.geometry) si
 * la tenemos, si no una línea recta origen → paradas → destino. Usado tanto
 * por el mapa del ticket (opengraph-image.tsx) como por el del PDF. */
export function getRoutePoints(trip: {
  geometry: string | null;
  originLat: number | null;
  originLon: number | null;
  destLat: number | null;
  destLon: number | null;
  waypoints: RoutePoint[];
}): RoutePoint[] {
  const hasCoords = trip.originLat != null && trip.originLon != null && trip.destLat != null && trip.destLon != null;
  if (!hasCoords) return [];

  if (trip.geometry) {
    try {
      const parsed: [number, number][] = JSON.parse(trip.geometry);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(([lat, lon]) => ({ lat, lon }));
    } catch {
      // JSON corrupto/antiguo: cae al fallback de línea recta de abajo
    }
  }
  return [{ lat: trip.originLat!, lon: trip.originLon! }, ...trip.waypoints, { lat: trip.destLat!, lon: trip.destLon! }];
}

export type StaticMap = {
  tiles: { left: number; top: number; dataUrl: string }[];
  project: (lat: number, lon: number) => { x: number; y: number };
};

/** Descarga los tiles OSM necesarios para cubrir `points` en un lienzo width×height. */
export async function buildStaticMap(
  points: { lat: number; lon: number }[],
  width: number,
  height: number
): Promise<StaticMap | null> {
  if (points.length === 0) return null;

  const bounds = points.reduce<Bounds>(
    (acc, p) => ({
      minLat: Math.min(acc.minLat, p.lat),
      maxLat: Math.max(acc.maxLat, p.lat),
      minLon: Math.min(acc.minLon, p.lon),
      maxLon: Math.max(acc.maxLon, p.lon),
    }),
    { minLat: points[0].lat, maxLat: points[0].lat, minLon: points[0].lon, maxLon: points[0].lon }
  );

  const zoom = fitZoom(bounds, width, height, 36, 16);
  const centerX = (lonToX(bounds.minLon, zoom) + lonToX(bounds.maxLon, zoom)) / 2;
  const centerY = (latToY(bounds.minLat, zoom) + latToY(bounds.maxLat, zoom)) / 2;
  const originX = centerX - width / 2;
  const originY = centerY - height / 2;

  const tileMinX = Math.floor(originX / TILE_SIZE);
  const tileMaxX = Math.floor((originX + width) / TILE_SIZE);
  const tileMinY = Math.floor(originY / TILE_SIZE);
  const tileMaxY = Math.floor((originY + height) / TILE_SIZE);
  const worldTiles = 2 ** zoom;

  const coords: { x: number; y: number }[] = [];
  for (let x = tileMinX; x <= tileMaxX; x++) {
    for (let y = tileMinY; y <= tileMaxY; y++) {
      if (y >= 0 && y < worldTiles) coords.push({ x, y });
    }
  }

  const tiles = (
    await Promise.all(
      coords.map(async ({ x, y }) => {
        const wrappedX = ((x % worldTiles) + worldTiles) % worldTiles;
        try {
          const res = await fetch(`https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`, {
            headers: { "User-Agent": "PagaLaGasofa/1.0 (+https://pagalagasofa.broslunas.com)" },
          });
          if (!res.ok) return null;
          const buf = Buffer.from(await res.arrayBuffer());
          return {
            left: x * TILE_SIZE - originX,
            top: y * TILE_SIZE - originY,
            dataUrl: `data:image/png;base64,${buf.toString("base64")}`,
          };
        } catch {
          return null;
        }
      })
    )
  ).filter((t): t is { left: number; top: number; dataUrl: string } => t !== null);

  if (tiles.length === 0) return null;

  return {
    tiles,
    project: (lat, lon) => ({ x: lonToX(lon, zoom) - originX, y: latToY(lat, zoom) - originY }),
  };
}
