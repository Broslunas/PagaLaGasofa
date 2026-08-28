"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  ChevronDown,
  Map as MapIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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

const ITEMS_PER_PAGE = 24;

export default function GasolinerasPage() {
  const [selectedProvince, setSelectedProvince] = useState("28"); // Madrid por defecto
  const [selectedFuel, setSelectedFuel] = useState<string>("gasolina95");
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(true);

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
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const mapStations = useMemo(() => {
    return sortedAndFilteredStations.map((s) => ({
      id: s.id,
      name: s.name,
      brand: s.brand,
      address: s.address,
      municipality: s.municipality,
      lat: s.lat,
      lng: s.lng,
      price: s.prices[selectedFuel as keyof typeof s.prices],
      isCheapest:
        s.prices[selectedFuel as keyof typeof s.prices] === cheapestPrice,
    }));
  }, [sortedAndFilteredStations, selectedFuel, cheapestPrice]);

  const activeFuelMeta = FUEL_TYPES.find((f) => f.id === selectedFuel);

  return (
    <div className="min-h-full bg-background text-foreground pb-20">
      {/* Top Header Hero */}
      <section className="relative border-b border-border/40 bg-gradient-to-b from-primary/10 via-background/60 to-background px-4 pt-8 pb-8 sm:px-6 md:pt-10 md:pb-10">
        <div className="mx-auto max-w-6xl">
          {/* Eyebrow Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Precios oficiales del Ministerio (MITECO)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant={showMap ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowMap((prev) => !prev)}
                className="gap-1.5 rounded-full text-xs font-medium"
              >
                <MapIcon className="size-3.5 text-primary" />
                {showMap ? "Ocultar Mapa" : "Ver Mapa"}
              </Button>

              <Button
                variant={locationDetected ? "secondary" : "outline"}
                size="sm"
                onClick={requestLocation}
                disabled={locating}
                className="gap-1.5 rounded-full text-xs font-medium"
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
                  : "Detectar ubicación"}
              </Button>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="mt-4 max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Gasolineras y Precios
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Consulta en tiempo real los precios de carburante en tu zona y encuentra las estaciones más baratas y cercanas.
            </p>
          </div>

          {/* Filters Bar Card */}
          <div className="mt-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-xs backdrop-blur-sm sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
              {/* Province Selector */}
              <div className="md:col-span-4">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Provincia
                </label>
                <div className="relative">
                  <select
                    value={selectedProvince}
                    onChange={(e) => {
                      setSelectedProvince(e.target.value);
                      setLocationDetected(false);
                    }}
                    aria-label="Seleccionar provincia"
                    className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-card px-3.5 pr-10 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-ring focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 dark:bg-card"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p.id} value={p.id} className="bg-card text-foreground">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Fuel Selector */}
              <div className="md:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Carburante
                </label>
                <div className="relative">
                  <select
                    value={selectedFuel}
                    onChange={(e) => setSelectedFuel(e.target.value)}
                    aria-label="Seleccionar tipo de carburante"
                    className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-card px-3.5 pr-10 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-ring focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 dark:bg-card"
                  >
                    {FUEL_TYPES.map((f) => (
                      <option key={f.id} value={f.id} className="bg-card text-foreground">
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Search Filter */}
              <div className="md:col-span-5">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Buscar por municipio o calle
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ej. Alcalá, Repsol, Calle..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-xl bg-background/80 pl-9.5 dark:bg-input/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Overview Map */}
          {showMap && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <MapPin className="size-4 text-primary" />
                  <span>Mapa de Gasolineras ({sortedAndFilteredStations.length})</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Mostrando precios para <strong>{activeFuelMeta?.label}</strong>
                </span>
              </div>
              <div className="h-[340px] w-full sm:h-[420px]">
                {loading ? (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Cargando puntos en el mapa...
                  </div>
                ) : mapStations.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No hay gasolineras disponibles en el mapa para esta búsqueda
                  </div>
                ) : (
                  <GasStationsOverviewMap
                    stations={mapStations}
                    fuelLabel={activeFuelMeta?.label || "Carburante"}
                    provinceId={selectedProvince}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Info Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium">
            <ArrowUpDown className="size-3.5 text-primary" />
            <span>
              Orden: <strong className="text-foreground">Precio más bajo</strong>
              {userLocation && (
                <span className="text-primary font-normal"> (desempate por cercanía)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              <span>
                Actualización: <strong className="text-foreground">{updatedAt || "Reciente"}</strong>
              </span>
            </div>
            <span className="text-border">|</span>
            <span className="font-semibold text-foreground">
              {sortedAndFilteredStations.length} gasolineras
            </span>
          </div>
        </div>

        {/* Stations View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-xs font-medium text-muted-foreground">
              Consultando estaciones y precios actualizados...
            </p>
          </div>
        ) : sortedAndFilteredStations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
            <AlertCircle className="size-10 text-muted-foreground/60" />
            <h3 className="mt-4 text-base font-semibold">No se encontraron gasolineras</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Intenta cambiar los términos de búsqueda o selecciona otra provincia.
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
                    className={`group relative flex flex-col justify-between rounded-xl border bg-card p-4.5 text-card-foreground shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-md ${
                      isCheapest
                        ? "border-emerald-500/40 bg-emerald-500/[0.03] ring-1 ring-emerald-500/20"
                        : "border-border/60"
                    }`}
                  >
                    {/* Header: Brand & Name */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {station.brand || "Estación"}
                        </span>

                        {isCheapest && (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            MÁS BARATO
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1.5 text-base font-semibold leading-tight line-clamp-1">
                        <Link
                          href={`/gasolineras/${station.id}?provincia=${selectedProvince}`}
                          className="hover:text-primary transition-colors"
                        >
                          {station.name}
                        </Link>
                      </h2>

                      {/* Location & Details */}
                      <div className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="line-clamp-1">
                            {station.address}, {station.municipality}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          {station.schedule && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Clock className="size-3 shrink-0 text-muted-foreground/70" />
                              <span className="line-clamp-1">{station.schedule}</span>
                            </div>
                          )}

                          {station.distanceKm !== undefined &&
                            station.distanceKm !== null && (
                              <div className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                                <Compass className="size-3" />
                                <span>{station.distanceKm.toFixed(1)} km</span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing Block */}
                    <div className="mt-4 border-t border-border/50 pt-3">
                      {/* Active Fuel Main Price */}
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 border border-border/40">
                        <span className="text-xs font-medium text-foreground/80">
                          {FUEL_TYPES.find((f) => f.id === selectedFuel)?.label}
                        </span>
                        <span
                          className={`text-lg font-bold tracking-tight ${
                            isCheapest
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground font-extrabold"
                          }`}
                        >
                          {activePrice ? `${activePrice.toFixed(3)} €/L` : "N/D"}
                        </span>
                      </div>

                      {/* Secondary Fuel Badges */}
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                        {FUEL_TYPES.filter((f) => f.id !== selectedFuel).map((f) => {
                          const p =
                            station.prices[f.id as keyof typeof station.prices];
                          return (
                            <div
                              key={f.id}
                              className="flex items-center justify-between rounded-md bg-card/60 px-2 py-1 border border-border/40 text-muted-foreground"
                            >
                              <span>{f.short}:</span>
                              <span className="font-medium text-foreground">
                                {p ? `${p.toFixed(3)}€` : "-"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Card Action Links */}
                      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs">
                        <Link
                          href={`/gasolineras/${station.id}?provincia=${selectedProvince}`}
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <Info className="size-3.5" />
                          Detalles y Mapa
                        </Link>

                        {station.lat !== 0 && station.lng !== 0 && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ExternalLink className="size-3.5" />
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
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  Mostrando{" "}
                  <strong className="text-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      sortedAndFilteredStations.length
                    )}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-foreground">
                    {sortedAndFilteredStations.length}
                  </strong>{" "}
                  gasolineras
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 rounded-lg px-3 text-xs"
                  >
                    <ChevronLeft className="size-3.5 mr-1" />
                    Anterior
                  </Button>

                  <span className="px-2 text-xs font-medium text-muted-foreground">
                    Página <strong className="text-foreground">{currentPage}</strong> de {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 rounded-lg px-3 text-xs"
                  >
                    Siguiente
                    <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
