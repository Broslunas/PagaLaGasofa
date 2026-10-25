import { describe, expect, it } from "vitest"

import { expiryFrom, isStale, liveState, positionAgeSeconds, positionSchema, shouldSendPosition, speedKmh, startSchema } from "./logic"

const sample = (lat: number, lng: number, t: number) => ({ lat, lng, t })

describe("shouldSendPosition", () => {
  const base = sample(40.4168, -3.7038, 0)
  it("la primera siempre se envía", () => expect(shouldSendPosition(null, base)).toBe(true))
  it("no más a menudo que cada 5 s, aunque te muevas", () => {
    expect(shouldSendPosition(base, sample(40.5, -3.7, 3_000))).toBe(false)
  })
  it("se envía si te has movido 15 m o más", () => {
    expect(shouldSendPosition(base, sample(40.4170, -3.7038, 6_000))).toBe(true) // ≈ 22 m
    expect(shouldSendPosition(base, sample(40.41685, -3.7038, 6_000))).toBe(false) // ≈ 5 m
  })
  it("latido cada 30 s estando parado", () => {
    expect(shouldSendPosition(base, sample(40.4168, -3.7038, 29_000))).toBe(false)
    expect(shouldSendPosition(base, sample(40.4168, -3.7038, 30_000))).toBe(true)
  })
})

describe("positionSchema / startSchema", () => {
  it("acepta posiciones válidas con datos opcionales ausentes", () => {
    expect(positionSchema.safeParse({ lat: 40, lng: -3 }).success).toBe(true)
    expect(positionSchema.safeParse({ lat: 40, lng: -3, accuracy: 12, heading: null, speed: 20 }).success).toBe(true)
  })
  it.each([{ lat: 91, lng: 0 }, { lat: 0, lng: 181 }, { lat: NaN, lng: 0 }, { lat: 0, lng: 0, speed: 500 }, { lat: 0, lng: 0, heading: 400 }])("rechaza %j", (v) => {
    expect(positionSchema.safeParse(v).success).toBe(false)
  })
  it("start: duración por defecto y límites", () => {
    expect(startSchema.parse({}).hours).toBe(4)
    expect(startSchema.safeParse({ hours: 13 }).success).toBe(false)
    expect(startSchema.safeParse({ hours: 0 }).success).toBe(false)
    expect(startSchema.safeParse({ tripShareId: "corto" }).success).toBe(false)
  })
})

describe("estado", () => {
  const now = new Date("2026-10-25T12:00:00Z")
  it("activa, parada y caducada", () => {
    expect(liveState({ stoppedAt: null, expiresAt: new Date("2026-10-25T13:00:00Z") }, now)).toBe("active")
    expect(liveState({ stoppedAt: new Date(), expiresAt: new Date("2026-10-25T13:00:00Z") }, now)).toBe("stopped")
    expect(liveState({ stoppedAt: null, expiresAt: new Date("2026-10-25T11:59:59Z") }, now)).toBe("expired")
  })
  it("antigüedad y señal", () => {
    expect(positionAgeSeconds("2026-10-25T11:59:30Z", now)).toBe(30)
    expect(positionAgeSeconds(null, now)).toBeNull()
    expect(isStale(30)).toBe(false)
    expect(isStale(120)).toBe(true)
    expect(isStale(null)).toBe(true)
  })
  it("caducidad y velocidad", () => {
    expect(expiryFrom(2, now).toISOString()).toBe("2026-10-25T14:00:00.000Z")
    expect(speedKmh(25)).toBe(90)
    expect(speedKmh(null)).toBeNull()
  })
})
