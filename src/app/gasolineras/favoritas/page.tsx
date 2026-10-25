import type { Metadata } from "next"

import { FavoritesList } from "@/components/stations/favorites-list"

export const metadata: Metadata = { title: "Gasolineras favoritas" }

export default function FavoritesPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Mis gasolineras favoritas</h1>
      <FavoritesList />
    </div>
  )
}
