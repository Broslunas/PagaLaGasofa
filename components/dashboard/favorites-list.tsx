"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Trash2, ExternalLink, Info, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

export function FavoritesList({ initialFavorites }: { initialFavorites: FavoriteItem[] }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(initialFavorites);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
            <div className="flex items-start justify-between gap-2">
              <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {station.brand || "Estación"}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFavorite(station.stationId)}
                disabled={deletingId === station.stationId}
                className="text-muted-foreground hover:text-rose-500"
                title="Eliminar de favoritos"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <h3 className="mt-2 text-sm font-semibold leading-tight line-clamp-1">
              <Link
                href={`/gasolineras/${station.stationId}${
                  station.provinceId ? `?provincia=${station.provinceId}` : ""
                }`}
                className="hover:text-primary transition-colors"
              >
                {station.name}
              </Link>
            </h3>

            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="line-clamp-2">
                {station.address}, {station.municipality} ({station.province})
              </span>
            </div>
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
