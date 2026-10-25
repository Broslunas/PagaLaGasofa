import type { Metadata } from "next"

import { RouteDemo } from "@/components/map/route-demo"

export const metadata: Metadata = { title: "Prueba de mapa", robots: { index: false } }

export default function MapDemoPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-semibold">Mapa y rutas</h1>
      <RouteDemo />
    </div>
  )
}
