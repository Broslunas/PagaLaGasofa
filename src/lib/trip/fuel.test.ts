import { describe, expect, it } from "vitest"

import { DEFAULT_FUEL_TYPE, FUEL_INFO, FUEL_TYPES, isFuelType, normalizeFuelType } from "./fuel"

describe("fuel", () => {
  it("todos los combustibles tienen información", () => {
    for (const t of FUEL_TYPES) expect(FUEL_INFO[t].co2KgPerUnit).toBeGreaterThan(0)
  })
  it("normaliza valores desconocidos al predeterminado", () => {
    expect(normalizeFuelType("diesel")).toBe("diesel")
    expect(normalizeFuelType("nafta")).toBe(DEFAULT_FUEL_TYPE)
    expect(normalizeFuelType(null)).toBe(DEFAULT_FUEL_TYPE)
    expect(isFuelType(42)).toBe(false)
  })
  it("el eléctrico usa kWh", () => {
    expect(FUEL_INFO.electrico.unit).toBe("kWh")
    expect(FUEL_INFO.diesel.unit).toBe("l")
  })
})
