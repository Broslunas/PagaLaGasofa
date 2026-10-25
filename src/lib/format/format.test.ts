import { describe, expect, it } from "vitest"

import { formatDistance, formatDuration, formatPrice, parseDecimal } from "./index"

describe("format", () => {
  it("parseDecimal admite coma y punto", () => {
    expect(parseDecimal("1,45")).toBe(1.45)
    expect(parseDecimal(" 6.2 ")).toBe(6.2)
    expect(parseDecimal("")).toBeNaN()
    expect(parseDecimal("abc")).toBeNaN()
    expect(parseDecimal("1,2,3")).toBeNaN()
  })
  it("formatPrice y formatDistance", () => {
    expect(formatPrice(1.699)).toBe("1,699")
    expect(formatPrice(1.7)).toBe("1,700")
    expect(formatDistance(0.42)).toBe("400 m")
    expect(formatDistance(3.46)).toBe("3,5 km")
  })
  it("formatDuration", () => {
    expect(formatDuration(45)).toBe("45 min")
    expect(formatDuration(125)).toBe("2 h 05 min")
  })
})
