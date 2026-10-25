import { describe, expect, it } from "vitest"

import { allocateCents, fromCents, toCents } from "./money"

describe("money", () => {
  it("convierte euros y céntimos sin errores de coma flotante", () => {
    expect(toCents(1.005)).toBe(101)
    expect(toCents(0.1 + 0.2)).toBe(30)
    expect(fromCents(1999)).toBe(19.99)
  })

  it("allocateCents reparte exactamente el total", () => {
    expect(allocateCents(100, [1, 1, 1])).toEqual([34, 33, 33])
    expect(allocateCents(10, [0, 1, 1])).toEqual([0, 5, 5])
    expect(allocateCents(0, [1, 2])).toEqual([0, 0])
  })

  it("allocateCents con pesos vacíos o nulos devuelve ceros", () => {
    expect(allocateCents(100, [])).toEqual([])
    expect(allocateCents(100, [0, 0])).toEqual([0, 0])
  })

  it("la suma siempre coincide con el total (propiedad)", () => {
    let seed = 42
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32
    for (let i = 0; i < 500; i++) {
      const total = Math.floor(rand() * 100000)
      const weights = Array.from({ length: 1 + Math.floor(rand() * 8) }, () => rand() * 10)
      const result = allocateCents(total, weights)
      expect(result.reduce((a, b) => a + b, 0)).toBe(total)
      expect(result.every((c) => Number.isInteger(c) && c >= 0)).toBe(true)
    }
  })
})
