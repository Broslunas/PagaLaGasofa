import { describe, expect, it } from "vitest"

import { safeNextPath } from "./redirect"

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/dashboard/trips?x=1")).toBe("/dashboard/trips?x=1")
  })
  it("usa el valor por defecto si falta", () => {
    expect(safeNextPath(null)).toBe("/app")
    expect(safeNextPath("")).toBe("/app")
  })
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "/a\nb"])(
    "rechaza %j",
    (v) => expect(safeNextPath(v)).toBe("/app"),
  )
})
