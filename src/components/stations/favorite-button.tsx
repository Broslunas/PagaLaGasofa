"use client"

import { Heart } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useFavorites } from "./use-favorites"

export function FavoriteButton({ stationId, fuelType, loginNext, compact }: { stationId: string; fuelType?: string; loginNext: string; compact?: boolean }) {
  const { state, toggle } = useFavorites()
  if (state.status === "loading") return <span className={cn("block", compact ? "size-8" : "h-9 w-32")} aria-hidden />

  if (state.status === "anonymous") {
    return (
      <Button asChild variant="outline" size={compact ? "icon-sm" : "sm"} title="Inicia sesión para guardar favoritas">
        <Link href={`/login?next=${encodeURIComponent(loginNext)}`} aria-label="Inicia sesión para guardar en favoritas">
          <Heart /> {!compact && "Favorita"}
        </Link>
      </Button>
    )
  }

  const active = state.ids.has(stationId)
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size={compact ? "icon-sm" : "sm"}
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritas" : "Añadir a favoritas"}
      onClick={() => toggle(stationId, fuelType)}
    >
      <Heart className={cn(active && "fill-current")} /> {!compact && (active ? "En favoritas" : "Favorita")}
    </Button>
  )
}
