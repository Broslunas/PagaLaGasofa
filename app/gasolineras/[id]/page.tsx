"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ExternalLink,
  Fuel,
  Info,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GasStationDetail } from "@/app/api/gasolineras/[id]/route";

// Leaflet dynamic import without SSR
const StationMap = dynamic(
  () => import("@/components/gasolineras/station-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground text-sm font-medium">
        Cargando mapa interactivo...
      </div>
    ),
  }
);

const FUEL_LABELS: Record<string, { label: string; tag: string }> = {
  gasolina95: { label: "Gasolina 95 E5", tag: "95" },
  gasolina95Premium: { label: "Gasolina 95 Premium", tag: "95+" },
  gasolina98: { label: "Gasolina 98 E5", tag: "98" },
  diesel: { label: "Diésel / Gasóleo A", tag: "Diésel" },
  dieselPremium: { label: "Diésel Premium / Plus", tag: "Diésel+" },
  dieselB: { label: "Gasóleo B (Agrícola)", tag: "Gasóleo B" },
  glp: { label: "GLP (Gases Licuados del Petróleo)", tag: "GLP" },
  gnc: { label: "GNC (Gas Natural Comprimido)", tag: "GNC" },
  gnl: { label: "GNL (Gas Natural Licuado)", tag: "GNL" },
  adblue: { label: "AdBlue", tag: "AdBlue" },
  bioetanol: { label: "Bioetanol", tag: "Bioetanol" },
  biodiesel: { label: "Biodiésel", tag: "Biodiésel" },
  dieselRenovable: { label: "Diésel Renovable (HVO)", tag: "HVO" },
  hidrogeno: { label: "Hidrógeno", tag: "H2" },
};

export default function GasolineraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const provincia = searchParams.get("provincia") || "";

  const [station, setStation] = useState<GasStationDetail | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadDetail() {
      setLoading(true);
      try {
        const query = provincia ? `?provincia=${provincia}` : "";
        const res = await fetch(`/api/gasolineras/${id}${query}`);
        if (!res.ok) throw new Error("No se pudo cargar la información de la estación");
        const json = await res.json();
        if (!ignore) {
          setStation(json.station);
          setUpdatedAt(json.updatedAt);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      ignore = true;
    };
  }, [id, provincia]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Cargando detalles de la gasolinera...
        </p>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold">Gasolinera no disponible</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "No se ha encontrado la estación solicitada."}
        </p>
        <Link
          href="/gasolineras"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  const availablePrices = Object.entries(station.prices).filter(
    ([, val]) => val !== null && val > 0
  );

  return (
    <div className="min-h-full bg-background text-foreground pb-20">
      {/* Top Header */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link
            href={`/gasolineras${provincia ? `?provincia=${provincia}` : ""}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a gasolineras
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {station.brand}
                </span>
                <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  MITECO Verificado
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {station.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {station.address}, {station.postalCode} {station.municipality} ({station.province})
              </p>
            </div>

            {station.lat !== 0 && station.lng !== 0 && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
              >
                <ExternalLink className="h-4 w-4" />
                Cómo llegar (Google Maps)
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        {/* Main Grid: Info + Map */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: All Prices & Metadata (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Prices Matrix */}
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Precios de Carburantes</h2>
                </div>
                {updatedAt && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {updatedAt}
                  </span>
                )}
              </div>

              {availablePrices.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay precios declarados en este momento.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {availablePrices.map(([fuelKey, price]) => {
                    const fuelMeta = FUEL_LABELS[fuelKey] || {
                      label: fuelKey,
                      tag: fuelKey,
                    };
                    return (
                      <div
                        key={fuelKey}
                        className="flex items-center justify-between rounded-xl border border-border/50 bg-accent/40 p-3.5 transition hover:border-primary/40 hover:bg-accent/60"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground/80">
                            {fuelMeta.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {fuelMeta.tag}
                          </span>
                        </div>
                        <span className="text-base font-black text-primary">
                          {price ? `${price.toFixed(3)} €/L` : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Station Details & Schedule */}
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                <Info className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Información de la Estación</h2>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-xs">
                <div>
                  <dt className="text-muted-foreground font-medium">Horario de apertura</dt>
                  <dd className="mt-0.5 text-foreground font-semibold">
                    {station.schedule || "No especificado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Tipo de Venta</dt>
                  <dd className="mt-0.5 text-foreground font-semibold">
                    {station.saleType}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Margen</dt>
                  <dd className="mt-0.5 text-foreground font-semibold">
                    {station.margin === "D"
                      ? "Margen Derecho"
                      : station.margin === "I"
                      ? "Margen Izquierdo"
                      : station.margin === "N"
                      ? "Ambos márgenes / Sin margen"
                      : station.margin}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Código Estación (IDEESS)</dt>
                  <dd className="mt-0.5 text-foreground font-semibold">{station.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Código Postal</dt>
                  <dd className="mt-0.5 text-foreground font-semibold">
                    {station.postalCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Municipio / Localidad</dt>
                  <dd className="mt-0.5 text-foreground font-semibold">
                    {station.municipality} ({station.city})
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right Column: Interactive Map (5 cols) */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm h-[400px] lg:h-[500px]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold">Ubicación exacta</h2>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {station.lat.toFixed(5)}, {station.lng.toFixed(5)}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
                {station.lat !== 0 && station.lng !== 0 ? (
                  <StationMap
                    lat={station.lat}
                    lng={station.lng}
                    name={station.name}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted/40 text-xs text-muted-foreground">
                    Coordenadas no disponibles para este punto
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
