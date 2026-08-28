"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FavoriteButtonProps {
  station: {
    id: string;
    name: string;
    brand?: string;
    address?: string;
    municipality?: string;
    province?: string;
    provinceId?: string;
    lat?: number;
    lng?: number;
    priceAtSave?: number | null;
  };
  initialIsFavorite?: boolean;
  onToggle?: (isFav: boolean) => void;
  size?: "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | "default";
  showLabel?: boolean;
  className?: string;
}

export function FavoriteButton({
  station,
  initialIsFavorite = false,
  onToggle,
  size = "icon",
  showLabel = false,
  className = "",
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  if (!session?.user) return null;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    onToggle?.(nextState);
    setLoading(true);

    try {
      if (nextState) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationId: station.id,
            name: station.name,
            brand: station.brand,
            address: station.address,
            municipality: station.municipality,
            province: station.province,
            provinceId: station.provinceId,
            lat: station.lat,
            lng: station.lng,
            priceAtSave: station.priceAtSave,
          }),
        });
      } else {
        await fetch(`/api/favorites/${station.id}`, {
          method: "DELETE",
        });
      }
    } catch {
      setIsFavorite(!nextState);
      onToggle?.(!nextState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={toggleFavorite}
      disabled={loading}
      className={`rounded-full transition-all hover:bg-rose-500/10 hover:text-rose-500 ${
        isFavorite ? "text-rose-500" : "text-muted-foreground"
      } ${className}`}
      title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
    >
      <Heart
        className={`size-4 transition-transform ${
          isFavorite ? "fill-rose-500 scale-110" : ""
        }`}
      />
      {showLabel && (
        <span className="ml-1.5 text-xs font-medium">
          {isFavorite ? "Guardada" : "Favorito"}
        </span>
      )}
    </Button>
  );
}
