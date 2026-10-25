import { describe, expect, it } from "vitest"

import { distanceToPolylineKm, haversineKm } from "./geo"

describe("geo", () => {
  it("haversine Madrid–Barcelona ≈ 505 km", () => {
    expect(haversineKm(40.4168, -3.7038, 41.3874, 2.1686)).toBeGreaterThan(500)
    expect(haversineKm(40.4168, -3.7038, 41.3874, 2.1686)).toBeLessThan(510)
  })

  const line: [number, number][] = [
    [40, -4],
    [40, -3],
    [40, -2],
  ]

  it("un punto sobre la línea está a ~0 km", () => {
    expect(distanceToPolylineKm({ lat: 40, lng: -3.5 }, line)).toBeLessThan(0.01)
  })

  it("un punto a 0,1° de latitud está a ~11 km", () => {
    const d = distanceToPolylineKm({ lat: 40.1, lng: -3 }, line)
    expect(d).toBeGreaterThan(10.5)
    expect(d).toBeLessThan(11.5)
  })

  it("polilíneas degeneradas", () => {
    expect(distanceToPolylineKm({ lat: 0, lng: 0 }, [])).toBe(Infinity)
    expect(distanceToPolylineKm({ lat: 40, lng: -3 }, [[40, -3]])).toBeCloseTo(0)
  })

  it("el muestreo no se salta el último tramo", () => {
    const long: [number, number][] = Array.from({ length: 1000 }, (_, i) => [40, -4 + i * 0.002])
    const near = { lat: 40.01, lng: long[999][1] }
    expect(distanceToPolylineKm(near, long, 50)).toBeLessThan(2)
  })
})

import { simplifyPolyline } from "./geo"

describe("simplifyPolyline", () => {
  it("elimina puntos colineales y conserva extremos", () => {
    const line: [number, number][] = Array.from({ length: 50 }, (_, i) => [-4 + i * 0.01, 40])
    const out = simplifyPolyline(line, 10)
    expect(out).toEqual([line[0], line[49]])
  })
  it("conserva un giro marcado", () => {
    const out = simplifyPolyline([[0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1]], 10)
    expect(out).toContainEqual([1, 0])
    expect(out[0]).toEqual([0, 0])
    expect(out.at(-1)).toEqual([1, 1])
  })
  it("no rompe con 0, 1 o 2 puntos", () => {
    expect(simplifyPolyline([])).toEqual([])
    expect(simplifyPolyline([[1, 1]])).toEqual([[1, 1]])
    expect(simplifyPolyline([[1, 1], [2, 2]])).toEqual([[1, 1], [2, 2]])
  })
})
