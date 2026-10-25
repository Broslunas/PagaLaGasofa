import type { Metadata } from "next"

import { VehiclesManager } from "@/components/dashboard/vehicles-manager"

export const metadata: Metadata = { title: "Mis vehículos", robots: { index: false } }

export default function VehiclesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mis vehículos</h1>
      <VehiclesManager />
    </div>
  )
}
