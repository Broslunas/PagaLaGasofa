import type { Metadata } from "next"

import { TripPlanner } from "@/components/trip/planner"

export const metadata: Metadata = {
  title: "Calcular viaje",
  description: "Calcula el coste del viaje y repártelo entre los pasajeros.",
}

export default function TripPage() {
  return <TripPlanner />
}
