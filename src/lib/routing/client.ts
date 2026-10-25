import type { LngLat, PlaceResult, RoutePoint, RouteResult } from "./types"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(data?.error ?? "Error de red", res.status)
  return data as T
}

export async function searchPlaces(
  query: string,
  bias: { lat: number; lng: number } | null,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const params = new URLSearchParams({ q: query })
  if (bias) {
    params.set("lat", String(bias.lat))
    params.set("lng", String(bias.lng))
  }
  const { results } = await parse<{ results: PlaceResult[] }>(
    await fetch(`/api/geocode?${params}`, { signal }),
  )
  return results
}

export async function reverseGeocode(point: RoutePoint | { lat: number; lng: number }, signal?: AbortSignal) {
  const params = new URLSearchParams({ lat: String(point.lat), lng: String(point.lng) })
  const { result } = await parse<{ result: PlaceResult }>(
    await fetch(`/api/reverse-geocode?${params}`, { signal }),
  )
  return result
}

export async function fetchRoute(points: RoutePoint[], signal?: AbortSignal): Promise<RouteResult> {
  return parse<RouteResult>(
    await fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
      signal,
    }),
  )
}

export const toLngLat = (p: { lat: number; lng: number }): LngLat => [p.lng, p.lat]
