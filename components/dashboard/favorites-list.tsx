"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MapPin, Trash2, ExternalLink, Info, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandAvatar } from "@/components/gasolineras/brand-avatar";

export interface FavoriteItem {
  id: string;
  stationId: string;
  name: string;
  brand: string;
  address: string;
  municipality: string;
  province: string;
  provinceId?: string | null;
  lat?: number | null;
  lng?: number | null;
  priceAtSave?: number | null;
}

// Compara el precio de Gasolina 95 guardado con el actual. current es null
// mientras no ha llegado la respuesta de /api/gasolineras/[id].
function formatPriceDelta(saved: number, current: number | null | undefined) {
  if (current == null) return { text: `Guardada a ${saved.toFixed(3)} €/L (95)`, className: "text-muted-foreground" };
  const diff = Math.round((current - saved) * 100) / 100;
  if (diff === 0) return { text: `Sin cambios: ${saved.toFixed(3)} €/L (95)`, className: "text-muted-foreground" };
  return {
    text: `${diff > 0 ? "+" : ""}${diff.toFixed(2)} €/L (95) desde que la guardaste`,
    className: diff > 0 ? "text-rose-500" : "text-emerald-500",
  };
}

export function FavoritesList({ initialFavorites }: { initialFavorites: FavoriteItem[] }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(initialFavorites);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number | null>>({});

  // Precio actual solo para las que tienen snapshot que comparar. Una vez al
  // montar; si se borra/añade un favorito no hace falta refrescar esto.
  useEffect(() => {
    initialFavorites
      .filter((f): f is FavoriteItem & { priceAtSave: number } => typeof f.priceAtSave === "number")
      .forEach((f) => {
        const url = f.provinceId
          ? `/api/gasolineras/${f.stationId}?provincia=${f.provinceId}`
          : `/api/gasolineras/${f.stationId}`;
        fetch(url)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            const price = data?.station?.prices?.gasolina95;
            setCurrentPrices((p) => ({ ...p, [f.stationId]: typeof price === "number" ? price : null }));
          })
          .catch(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFavorite = async (stationId: string) => {
    setDeletingId(stationId);
    try {
      const res = await fetch(`/api/favorites/${stationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.stationId !== stationId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
        <Heart className="size-10 text-muted-foreground/50" />
        <h3 className="mt-4 text-base font-semibold">No tienes gasolineras favoritas</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Explora las gasolineras y pulsa el icono de corazón para guardarlas aquí.
        </p>
        <Link
          href="/gasolineras"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
        >
          Explorar gasolineras
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {favorites.map((station) => (
        <div
          key={station.id}
          className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 text-card-foreground shadow-xs transition hover:border-primary/40"
        >
          <div>
            <div className="flex items-start gap-3">
              <BrandAvatar brand={station.brand} className="size-11 text-xs rounded-xl p-1.5 shadow-xs" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    {station.brand || "Estación"}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeFavorite(station.stationId)}
                    disabled={deletingId === station.stationId}
                    className="text-muted-foreground hover:text-rose-500 shrink-0 size-7"
                    title="Eliminar de favoritos"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <h3 className="mt-1 text-sm font-semibold leading-tight line-clamp-1">
                  <Link
                    href={`/gasolineras/${station.stationId}${
                      station.provinceId ? `?provincia=${station.provinceId}` : ""
                    }`}
                    className="hover:text-primary transition-colors"
                  >
                    {station.name}
                  </Link>
                </h3>
              </div>
            </div>

            <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="line-clamp-2">
                {station.address}, {station.municipality} ({station.province})
              </span>
            </div>

            {typeof station.priceAtSave === "number" &&
              (() => {
                const { text, className } = formatPriceDelta(station.priceAtSave, currentPrices[station.stationId]);
                return (
                  <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${className}`}>
                    <Fuel className="size-3.5" />
                    {text}
                  </div>
                );
              })()}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
            <Link
              href={`/gasolineras/${station.stationId}${
                station.provinceId ? `?provincia=${station.provinceId}` : ""
              }`}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <Info className="size-3.5" />
              Ver precios y mapa
            </Link>

            {station.lat && station.lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="size-3.5" />
                Cómo llegar
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
