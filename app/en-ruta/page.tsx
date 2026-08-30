"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FUEL_TYPES } from "@/lib/provinces";
import { type GeoPoint } from "@/components/calculator/location-field";
import { StepRoute } from "@/components/calculator/step-route";
import { BrandAvatar } from "@/components/gasolineras/brand-avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buildMapsHref } from "@/lib/maps-link";
import { Fuel, MapPin, ExternalLink, Info, Route, Milestone, Clock, Plus, X } from "lucide-react";

const selectClass =
  "h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-card px-2.5 py-1 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-card";

function formatDuration(min: number) {
  if (!min || min <= 0) return "";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

// Compara con tolerancia (~11m) porque la parada añadida es el propio punto de la
// estación: no hace falta guardar un id aparte, basta con mirar si ya está en waypoints.
const samePoint = (w: GeoPoint | null, lat: number, lng: number) =>
  !!w && Math.abs(w.lat - lat) < 1e-4 && Math.abs(w.lon - lng) < 1e-4;

// Umbrales para colorear los marcadores del mapa: verde = entre las más baratas
// de la ruta (a un céntimo o menos de la mínima), azul = casi sin desviarse.
const CHEAP_MARGIN_EUR = 0.01;
const CLOSE_TO_ROUTE_KM = 0.3;

interface RouteStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  municipality: string;
  provinceId?: string;
  lat: number;
  lng: number;
  distanceFromRouteKm: number;
  prices: {
    gasolina95: number | null;
    gasolina98: number | null;
    diesel: number | null;
    dieselPremium: number | null;
    glp: number | null;
  };
}

export default function EnRutaPage() {
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [waypoints, setWaypoints] = useState<(GeoPoint | null)[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState("");

  const [fuelType, setFuelType] = useState("gasolina95");
  const [stations, setStations] = useState<RouteStation[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState("");

  async function fetchDistance() {
    const points = [origin, ...waypoints, destination];
    if (points.some((p) => !p)) return;
    setDistanceLoading(true);
    setDistanceError("");
    try {
      const res = await fetch("/api/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: points.map((p) => ({ lat: p!.lat, lon: p!.lon })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al calcular la distancia");
      setDistanceKm(data.distanceKm);
      setDurationMin(typeof data.durationMin === "number" ? data.durationMin : 0);
      setRoutePolyline(Array.isArray(data.geometry) ? data.geometry : []);
    } catch (e) {
      setDistanceError(e instanceof Error ? e.message : "Error al calcular la distancia");
    } finally {
      setDistanceLoading(false);
    }
  }

  const pointsKey = JSON.stringify([origin, ...waypoints, destination].map((p) => (p ? [p.lat, p.lon] : null)));
  useEffect(() => {
    if (origin && destination && waypoints.every((w) => w)) {
      fetchDistance();
    } else {
      setRoutePolyline([]);
      setDurationMin(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  // Añade/quita una gasolinera como parada de la ruta: reutiliza el mismo mecanismo
  // de waypoints de StepRoute, así que el recálculo de ruta y duración es automático.
  function toggleStop(s: RouteStation) {
    if (waypoints.some((w) => samePoint(w, s.lat, s.lng))) {
      setWaypoints(waypoints.filter((w) => !samePoint(w, s.lat, s.lng)));
    } else {
      setWaypoints([...waypoints, { label: `${s.name} — ${s.address}`, lat: s.lat, lon: s.lng }]);
    }
  }

  useEffect(() => {
    if (routePolyline.length < 2) {
      setStations([]);
      return;
    }
    let ignore = false;
    setStationsLoading(true);
    setStationsError("");
    fetch("/api/gasolineras/en-ruta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polyline: routePolyline, fuel: fuelType }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ignore) return;
        if (!ok) throw new Error(data.error ?? "Error al buscar gasolineras en la ruta");
        setStations(data.stations || []);
      })
      .catch((e) => {
        if (!ignore) setStationsError(e instanceof Error ? e.message : "Error al buscar gasolineras en la ruta");
      })
      .finally(() => {
        if (!ignore) setStationsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [routePolyline, fuelType]);

  // Ruta completa con la gasolinera añadida como parada (si aún no lo es).
  function buildRouteHref(s: RouteStation) {
    if (!origin || !destination) return `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
    const alreadyStop = waypoints.some((w) => samePoint(w, s.lat, s.lng));
    const stops = (alreadyStop ? waypoints : [...waypoints, { lat: s.lat, lon: s.lng }]).filter(
      (w): w is GeoPoint => !!w
    );
    return buildMapsHref(origin, stops, destination);
  }

  // Ruta general: origen -> paradas ya añadidas -> destino (sin forzar ninguna gasolinera).
  const generalRouteHref =
    origin && destination ? buildMapsHref(origin, waypoints.filter((w): w is GeoPoint => !!w), destination) : null;

  const routePrices = stations
    .map((s) => s.prices[fuelType as keyof typeof s.prices])
    .filter((p): p is number => p != null);
  const cheapestPrice = routePrices.length ? Math.min(...routePrices) : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 md:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Gasolineras en tu ruta</h1>
        <p className="text-muted-foreground">Traza el trayecto y mira dónde repostar más barato de camino.</p>
      </div>

      <div className="h-[420px] md:h-[480px]">
        <StepRoute
          origin={origin}
          destination={destination}
          waypoints={waypoints}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          onWaypointsChange={setWaypoints}
          distanceKm={distanceKm}
          setDistanceKm={setDistanceKm}
          routePolyline={routePolyline}
          distanceLoading={distanceLoading}
          distanceError={distanceError}
          onRetryDistance={fetchDistance}
          stationMarkers={stations.map((s) => {
            const price = s.prices[fuelType as keyof typeof s.prices];
            const colorKind: "cheap" | "close" | "default" =
              price != null && cheapestPrice != null && price <= cheapestPrice + CHEAP_MARGIN_EUR
                ? "cheap"
                : s.distanceFromRouteKm <= CLOSE_TO_ROUTE_KM
                  ? "close"
                  : "default";
            return {
              id: s.id,
              lat: s.lat,
              lon: s.lng,
              title: `${s.name} — ${price ? `${price.toFixed(3)} €/L` : "N/D"}`,
              priceLabel: price ? `${price.toFixed(3)}€` : "N/D",
              colorKind,
              selected: waypoints.some((w) => samePoint(w, s.lat, s.lng)),
              onClick: () => toggleStop(s),
            };
          })}
        />
      </div>

      {routePolyline.length >= 2 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm">
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5">
              <Milestone size={15} className="text-primary" />
              {distanceKm.toFixed(1)} km
            </span>
            {durationMin > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-primary" />
                {formatDuration(durationMin)}
              </span>
            )}
          </div>
          {generalRouteHref && (
            <a
              href={generalRouteHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Route size={13} />
              Abrir ruta en Maps
            </a>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-1.5">
            <Fuel size={16} className="text-primary" />
            Combustible
          </CardTitle>
          <select
            className={selectClass + " max-w-[220px]"}
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
          >
            {FUEL_TYPES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {routePolyline.length < 2 ? (
            <p className="text-sm text-muted-foreground">Elige origen y destino para ver las gasolineras de la ruta.</p>
          ) : stationsLoading ? (
            <p className="text-sm text-muted-foreground">Buscando gasolineras cerca de la ruta...</p>
          ) : stationsError ? (
            <p className="text-sm text-destructive">{stationsError}</p>
          ) : stations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay gasolineras a menos de 3km de esta ruta.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stations.map((s, i) => {
                const price = s.prices[fuelType as keyof typeof s.prices];
                const isStop = waypoints.some((w) => samePoint(w, s.lat, s.lng));
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      isStop
                        ? "border-primary/50 bg-primary/[0.04]"
                        : i === 0
                          ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                          : "border-border/60"
                    }`}
                  >
                    <BrandAvatar brand={s.brand} className="size-10 shrink-0 rounded-lg p-1 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{s.address}, {s.municipality}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Route size={11} className="shrink-0" />
                        <span>{s.distanceFromRouteKm.toFixed(1)} km de la ruta</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`text-lg font-bold ${i === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {price ? `${price.toFixed(3)} €/L` : "N/D"}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <Link href={`/gasolineras/${s.id}${s.provinceId ? `?provincia=${s.provinceId}` : ""}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Info size={12} />
                          Detalles
                        </Link>
                        <a
                          href={buildRouteHref(s)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink size={12} />
                          Ir
                        </a>
                        <button
                          type="button"
                          onClick={() => toggleStop(s)}
                          className={`flex items-center gap-1 ${
                            isStop ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {isStop ? <X size={12} /> : <Plus size={12} />}
                          {isStop ? "Quitar parada" : "Añadir parada"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
