import { z } from "zod"

export const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const routeRequestSchema = z.object({
  points: z.array(pointSchema).min(2).max(12),
})

export type RoutePoint = z.infer<typeof pointSchema>

/** [lng, lat], el orden de GeoJSON y MapLibre. */
export type LngLat = [number, number]

export interface RouteResult {
  distanceKm: number
  durationMin: number
  /** Un valor por tramo entre puntos consecutivos. */
  legsKm: number[]
  geometry: LngLat[]
}

export interface PlaceResult {
  id: string
  /** Texto completo para mostrar en el campo una vez elegido. */
  label: string
  title: string
  subtitle: string
  lat: number
  lng: number
}
