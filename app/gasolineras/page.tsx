"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  PROVINCES,
  FUEL_TYPES,
  findClosestProvince,
  getDistanceKm,
} from "@/lib/provinces";
import {
  MapPin,
  Clock,
  Search,
  ArrowUpDown,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Navigation,
  Compass,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

const ITEMS_PER_PAGE = 24;

export default function GasolinerasPage() {
  const [selectedProvince, setSelectedProvince] = useState("28"); // Madrid por defecto
  const [selectedFuel, setSelectedFuel] = useState<string>("gasolina95");
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // User location state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Geolocation request handler
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
      (err) => {
        console.warn("Geolocation denied or error:", err.message);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // Try auto-detect location on mount if permitted
  useEffect(() => {
    if ("permissions" in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
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
      setCurrentPage(1);
      try {
        const res = await fetch(
          `/api/gasolineras?provincia=${selectedProvince}&fuel=${selectedFuel}`
        );
        if (!res.ok) throw new Error("Error loading stations");
        const json = await res.json();
        if (!ignore) {
          setStations(json.stations || []);
          setUpdatedAt(json.updatedAt || "");
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

  // Compute distances & sort: first by price ascending, tie-breaker by distance ascending
  const sortedAndFilteredStations = useMemo(() => {
    const listWithDistance: GasStation[] = stations.map((s) => {
      const dist =
        userLocation && s.lat !== 0 && s.lng !== 0
          ? getDistanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng)
          : null;
      return { ...s, distanceKm: dist };
    });

    let list = listWithDistance;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.municipality.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query) ||
          s.city.toLowerCase().includes(query)
      );
    }

    // Sort by price ASC, then distance ASC
    return [...list].sort((a, b) => {
      const pA = a.prices[selectedFuel as keyof typeof a.prices] ?? Infinity;
      const pB = b.prices[selectedFuel as keyof typeof b.prices] ?? Infinity;

      if (pA !== pB) {
        return pA - pB;
      }

      // Tie breaker: distance to user if available
      const dA = a.distanceKm ?? Infinity;
      const dB = b.distanceKm ?? Infinity;
      return dA - dB;
    });
  }, [stations, searchQuery, userLocation, selectedFuel]);

  const cheapestPrice = useMemo(() => {
    const validPrices = sortedAndFilteredStations
      .map((s) => s.prices[selectedFuel as keyof typeof s.prices])
      .filter((p): p is number => p !== null && p > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : null;
  }, [sortedAndFilteredStations, selectedFuel]);

  const totalPages =
    Math.ceil(sortedAndFilteredStations.length / ITEMS_PER_PAGE) || 1;
  const paginatedStations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredStations.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredStations, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 240, behavior: "smooth" });
  };

  return (
    <div className="min-h-full bg-background text-foreground pb-16">
      {/* Header Banner */}
      <div className="relative border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Precios oficiales del Ministerio (MITECO / GasofApp)
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Gasolineras y Precios de Carburante
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                Compara precios de combustible en tiempo real y encuentra las estaciones más económicas y cercanas.
              </p>
            </div>

            {/* Geolocation Trigger Button */}
            <div className="shrink-0">
              <Button
                variant={locationDetected ? "secondary" : "outline"}
                size="sm"
                onClick={requestLocation}
                disabled={locating}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Navigation
                  className={`h-3.5 w-3.5 ${
                    locating
                      ? "animate-spin text-primary"
                      : locationDetected
                      ? "text-emerald-500 fill-emerald-500/20"
                      : "text-primary"
                  }`}
                />
                {locating
                  ? "Detectando..."
                  : locationDetected
                  ? "Ubicación activa"
                  : "Detectar mi ubicación"}
              </Button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Province Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Provincia
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setLocationDetected(false);
                }}
                aria-label="Seleccionar provincia"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium shadow-sm transition-colors focus:border-primary focus:outline-none"
              >
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fuel Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Carburante
              </label>
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                aria-label="Seleccionar tipo de carburante"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium shadow-sm transition-colors focus:border-primary focus:outline-none"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Buscar por municipio o calle
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ej. Alcalá, Repsol, Calle..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl pl-9"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {/* Info & Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium">
            <ArrowUpDown className="h-4 w-4 text-primary" />
            <span>
              Orden:{" "}
              <strong className="text-foreground">
                Precio más bajo
              </strong>
              {userLocation && (
                <span className="text-primary font-normal">
                  {" "}
                  (desempate por cercanía)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>
                Actualización:{" "}
                <strong className="text-foreground">
                  {updatedAt || "Recién actualizado"}
                </strong>
              </span>
            </div>
            <span className="hidden sm:inline text-border">|</span>
            <span className="font-semibold text-foreground">
              {sortedAndFilteredStations.length} gasolineras
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Consultando estaciones y precios actualizados...
            </p>
          </div>
        ) : sortedAndFilteredStations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-bold">No se encontraron gasolineras</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Intenta cambiar el término de búsqueda o la provincia seleccionada.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedStations.map((station, idx) => {
                const activePrice =
                  station.prices[selectedFuel as keyof typeof station.prices];
                const isCheapest =
                  activePrice !== null &&
                  cheapestPrice !== null &&
                  activePrice === cheapestPrice;

                return (
                  <div
                    key={station.id || idx}
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md ${
                      isCheapest
                        ? "border-emerald-500/50 bg-emerald-500/[0.02] ring-1 ring-emerald-500/30"
                        : "border-border/60"
                    }`}
                  >
                    {/* Top info */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {station.brand}
                          </span>
                          <h2 className="mt-1 text-base font-bold leading-snug line-clamp-1">
                            <Link
                              href={`/gasolineras/${station.id}?provincia=${selectedProvince}`}
                              className="hover:text-primary transition-colors"
                            >
                              {station.name}
                            </Link>
                          </h2>
                        </div>
                        {isCheapest && (
                          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            MÁS BARATO
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="line-clamp-2">
                            {station.address}, {station.municipality}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {station.schedule && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                              <span className="line-clamp-1">{station.schedule}</span>
                            </div>
                          )}
                          {station.distanceKm !== undefined &&
                            station.distanceKm !== null && (
                              <div className="flex items-center gap-1 font-semibold text-primary ml-auto">
                                <Compass className="h-3.5 w-3.5" />
                                <span>{station.distanceKm.toFixed(1)} km</span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing Matrix */}
                    <div className="mt-5 border-t border-border/50 pt-3.5">
                      {/* Primary Highlight Price */}
                      <div className="flex items-baseline justify-between rounded-xl bg-accent/50 p-2.5">
                        <span className="text-xs font-semibold text-foreground/80">
                          {FUEL_TYPES.find((f) => f.id === selectedFuel)?.label}
                        </span>
                        <span
                          className={`text-lg font-black tracking-tight ${
                            isCheapest
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-primary"
                          }`}
                        >
                          {activePrice ? `${activePrice.toFixed(3)} €/L` : "No disponible"}
                        </span>
                      </div>

                      {/* Secondary Prices */}
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                        {FUEL_TYPES.filter((f) => f.id !== selectedFuel).map((f) => {
                          const p =
                            station.prices[f.id as keyof typeof station.prices];
                          return (
                            <div
                              key={f.id}
                              className="flex items-center justify-between rounded-md bg-card px-2 py-1 border border-border/40 text-muted-foreground"
                            >
                              <span>{f.short}:</span>
                              <span className="font-medium text-foreground">
                                {p ? `${p.toFixed(3)}€` : "-"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Links Action Row */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs font-medium">
                        <Link
                          href={`/gasolineras/${station.id}?provincia=${selectedProvince}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Info className="h-3.5 w-3.5" />
                          Detalles y Mapa
                        </Link>

                        {station.lat !== 0 && station.lng !== 0 && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Cómo llegar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 pt-6">
                <p className="text-xs text-muted-foreground">
                  Mostrando{" "}
                  <strong>
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      sortedAndFilteredStations.length
                    )}
                  </strong>{" "}
                  de <strong>{sortedAndFilteredStations.length}</strong> gasolineras
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 rounded-lg px-3 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1 px-2 text-xs font-medium">
                    <span>
                      Página {currentPage} de {totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 rounded-lg px-3 text-xs"
                  >
                    Siguiente
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
