import { describe, expect, it } from "vitest"

import { timeAgo } from "./time-ago"

const now = new Date("2026-10-25T12:00:00Z")
const ago = (ms: number) => new Date(now.getTime() - ms)

describe("timeAgo", () => {
  it("rangos", () => {
    expect(timeAgo(ago(20_000), now)).toBe("ahora mismo")
    expect(timeAgo(ago(5 * 60_000), now)).toBe("hace 5 minutos")
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe("hace 3 horas")
    expect(timeAgo(ago(24 * 3_600_000), now)).toBe("ayer")
    expect(timeAgo(ago(4 * 86_400_000), now)).toBe("hace 4 días")
  })
  it("acepta cadenas ISO", () => {
    expect(timeAgo("2026-10-25T11:00:00Z", now)).toBe("hace 1 hora")
  })
})
