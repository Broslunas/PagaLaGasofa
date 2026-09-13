"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  PROVINCES,
  FUEL_TYPES,
  findClosestProvince,
  getDistanceKm,
} from "@/lib/provinces";
import {
  MapPin,
  Sparkles,
  ArrowRight,
  Navigation,
  Compass,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GasStationsOverviewMap = dynamic(
  () => import("@/components/gasolineras/overview-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted/40 text-xs font-medium text-muted-foreground">
        Cargando mapa de gasolineras...
      </div>
    ),
  }
);

interface GasStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  postalCode: string;
  city: string;
  municipality: string;
  province: string;
  schedule: string;
  lat: number;
  lng: number;
  prices: {
    gasolina95: number | null;
    gasolina98: number | null;
    diesel: number | null;
    dieselPremium: number | null;
    glp: number | null;
  };
  distanceKm?: number | null;
}

export function GasolinerasMapSection() {
  const [mounted, setMounted] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("28");
  const [selectedFuel, setSelectedFuel] = useState<string>("gasolina95");
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const autoProv = findClosestProvince(latitude, longitude);
        setSelectedProvince(autoProv);
        setLocationDetected(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if ("permissions" in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((res) => {
          if (res.state === "granted") {
            requestLocation();
          }
        })
        .catch(() => {});
    }
  }, [requestLocation]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/gasolineras?provincia=${selectedProvince}&fuel=${selectedFuel}`
        );
        if (!res.ok) throw new Error("Error loading stations");
        const json = await res.json();
        if (!ignore) {
          setStations(json.stations || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [selectedProvince, selectedFuel]);

  const cheapestPrice = useMemo(() => {
    const validPrices = stations
      .map((s) => s.prices[selectedFuel as keyof typeof s.prices])
      .filter((p): p is number => p !== null && p > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : null;
  }, [stations, selectedFuel]);

  const mapStations = useMemo(() => {
    return stations.map((s) => {
      const dist =
        userLocation && s.lat !== 0 && s.lng !== 0
          ? getDistanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng)
          : null;
      const price = s.prices[selectedFuel as keyof typeof s.prices];
      return {
        id: s.id,
        name: s.name,
        brand: s.brand,
        address: s.address,
        municipality: s.municipality,
        lat: s.lat,
        lng: s.lng,
        price,
        distanceKm: dist,
        isCheapest: price === cheapestPrice,
      };
    });
  }, [stations, selectedFuel, cheapestPrice, userLocation]);

  const activeFuelMeta = FUEL_TYPES.find((f) => f.id === selectedFuel);

  return (
    <section className="relative px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Header Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Mapa oficial de gasolineras
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Compara precios oficiales actualizados hoy en tu provincia antes de repostar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Province Selector */}
            <div className="relative">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setLocationDetected(false);
                }}
                aria-label="Seleccionar provincia"
                className="h-10 cursor-pointer appearance-none rounded-full border border-border/80 bg-card px-4 pr-9 text-xs font-medium text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none dark:bg-card"
              >
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Fuel Selector */}
            <div className="relative">
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                aria-label="Seleccionar carburante"
                className="h-10 cursor-pointer appearance-none rounded-full border border-border/80 bg-card px-4 pr-9 text-xs font-medium text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none dark:bg-card"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f.id} value={f.id} className="bg-card text-foreground">
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Auto Detect Location */}
            <Button
              variant={locationDetected ? "secondary" : "outline"}
              size="sm"
              onClick={requestLocation}
              disabled={locating}
              className="h-10 gap-2 rounded-full px-4 text-xs font-medium"
            >
              <Navigation
                className={`size-3.5 ${
                  locating
                    ? "animate-spin text-primary"
                    : locationDetected
                    ? "text-emerald-500"
                    : "text-primary"
                }`}
              />
              {locating
                ? "Detectando..."
                : locationDetected
                ? "Ubicación activa"
                : "Mi ubicación"}
            </Button>
          </div>
        </div>

        {/* Double-Bezel Map Container */}
        <div className="rounded-3xl p-1.5 ring-1 ring-border/50 bg-muted/20 shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="overflow-hidden rounded-[calc(1.5rem-0.375rem)] border border-border/40 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-5 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <MapPin className="size-4 text-primary" />
                <span className="font-mono">{mapStations.length}</span>
                <span>estaciones encontradas</span>
              </div>
              <Link
                href={`/gasolineras?provincia=${selectedProvince}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <span>Ver listado detallado</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="h-[420px] w-full sm:h-[500px]">
              {!mounted || loading ? (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Cargando mapa de estaciones...
                </div>
              ) : (
                <GasStationsOverviewMap
                  key={`${selectedProvince}-${selectedFuel}`}
                  stations={mapStations}
                  fuelLabel={activeFuelMeta?.label || "Carburante"}
                  provinceId={selectedProvince}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
