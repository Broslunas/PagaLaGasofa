import { describe, expect, it } from "vitest"

import { CONSENT_TTL_MS, CONSENT_VERSION, makeConsent, parseConsent } from "./consent"

const NOW = 1_800_000_000_000

describe("consent", () => {
  it("makeConsent: la grabación exige analítica", () => {
    expect(makeConsent(false, true, NOW)).toMatchObject({ analytics: false, recording: false })
    expect(makeConsent(true, true, NOW)).toMatchObject({ analytics: true, recording: true })
  })
  it("round trip", () => {
    const c = makeConsent(true, false, NOW)
    expect(parseConsent(JSON.stringify(c), NOW + 1000)).toEqual(c)
  })
  it("sin decisión, corrupto o de otra versión → null (se vuelve a preguntar)", () => {
    expect(parseConsent(null)).toBeNull()
    expect(parseConsent("{no json")).toBeNull()
    expect(parseConsent(JSON.stringify({ analytics: true, recording: true, version: CONSENT_VERSION + 1, at: NOW }), NOW)).toBeNull()
    expect(parseConsent(JSON.stringify({ analytics: "sí", recording: false, version: CONSENT_VERSION, at: NOW }), NOW)).toBeNull()
  })
  it("caduca a los 12 meses", () => {
    const raw = JSON.stringify(makeConsent(true, true, NOW))
    expect(parseConsent(raw, NOW + CONSENT_TTL_MS - 1)).not.toBeNull()
    expect(parseConsent(raw, NOW + CONSENT_TTL_MS + 1)).toBeNull()
  })
  it("un valor guardado con grabación sin analítica se corrige", () => {
    const raw = JSON.stringify({ analytics: false, recording: true, version: CONSENT_VERSION, at: NOW })
    expect(parseConsent(raw, NOW)?.recording).toBe(false)
  })
})
