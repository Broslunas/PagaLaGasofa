import { describe, expect, it } from "vitest"

import { generateManageToken, generateShareId, hashToken, SHARE_ID_PATTERN } from "./tokens"

describe("tokens", () => {
  it("shareId tiene 12 caracteres base62 y no se repite", () => {
    const ids = new Set(Array.from({ length: 2000 }, generateShareId))
    expect(ids.size).toBe(2000)
    for (const id of ids) expect(id).toMatch(SHARE_ID_PATTERN)
  })
  it("manageToken tiene 32 caracteres", () => {
    expect(generateManageToken()).toMatch(/^[0-9A-Za-z]{32}$/)
  })
  it("hashToken es determinista y de 64 hex", async () => {
    const a = await hashToken("abc")
    expect(a).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
    expect(await hashToken("abc")).toBe(a)
  })
})
