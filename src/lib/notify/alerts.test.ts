import { describe, expect, it } from "vitest"

import { evaluateAlert } from "./alerts"
import { priceDropMessage } from "./messages"

describe("evaluateAlert · sin umbral", () => {
  it("la primera lectura solo fija la referencia", () => {
    expect(evaluateAlert({ current: 1.7, lastSeen: null, threshold: null })).toEqual({ notify: false, nextSeen: 1.7 })
  })
  it("avisa de una bajada de 1 céntimo o más", () => {
    expect(evaluateAlert({ current: 1.69, lastSeen: 1.7, threshold: null })).toEqual({ notify: true, reason: "drop", nextSeen: 1.69 })
    expect(evaluateAlert({ current: 1.659, lastSeen: 1.699, threshold: null }).notify).toBe(true)
  })
  it("no avisa de bajadas menores de un céntimo", () => {
    expect(evaluateAlert({ current: 1.695, lastSeen: 1.699, threshold: null }).notify).toBe(false)
  })
  it("nunca avisa de subidas, pero actualiza la referencia", () => {
    expect(evaluateAlert({ current: 1.75, lastSeen: 1.7, threshold: null })).toEqual({ notify: false, nextSeen: 1.75 })
  })
  it("sin cambios no avisa", () => {
    expect(evaluateAlert({ current: 1.7, lastSeen: 1.7, threshold: null }).notify).toBe(false)
  })
  it("sin precio actual conserva la referencia", () => {
    expect(evaluateAlert({ current: null, lastSeen: 1.7, threshold: null })).toEqual({ notify: false, nextSeen: 1.7 })
  })
  it("no cae en errores de coma flotante", () => {
    expect(evaluateAlert({ current: 1.1, lastSeen: 1.11, threshold: null }).notify).toBe(true) // 0.01 exacto
  })
})

describe("evaluateAlert · con umbral", () => {
  it("avisa al cruzar el umbral hacia abajo", () => {
    expect(evaluateAlert({ current: 1.649, lastSeen: 1.68, threshold: 1.65 })).toEqual({ notify: true, reason: "threshold", nextSeen: 1.649 })
    expect(evaluateAlert({ current: 1.65, lastSeen: 1.651, threshold: 1.65 }).notify).toBe(true)
  })
  it("no repite el aviso mientras siga por debajo", () => {
    expect(evaluateAlert({ current: 1.62, lastSeen: 1.64, threshold: 1.65 }).notify).toBe(false)
  })
  it("no avisa si sigue por encima, aunque baje", () => {
    expect(evaluateAlert({ current: 1.7, lastSeen: 1.75, threshold: 1.65 }).notify).toBe(false)
  })
  it("vuelve a avisar tras subir por encima y volver a bajar", () => {
    const up = evaluateAlert({ current: 1.7, lastSeen: 1.64, threshold: 1.65 })
    expect(up).toEqual({ notify: false, nextSeen: 1.7 })
    expect(evaluateAlert({ current: 1.64, lastSeen: up.nextSeen, threshold: 1.65 }).notify).toBe(true)
  })
})

describe("priceDropMessage", () => {
  const base = { stationId: "4375", stationName: "Repsol", locality: "Madrid", fuel: "gasolina95" as const, price: 1.649, previous: 1.699 }
  it("mensaje de bajada", () => {
    const m = priceDropMessage({ ...base, reason: "drop", threshold: null })
    expect(m.title).toBe("Repsol (Madrid): 1,649 €/l")
    expect(m.body).toBe("Gasolina 95 baja 0,050 €: de 1,699 a 1,649 €/l.")
    expect(m.url).toBe("/gasolineras/4375")
  })
  it("mensaje de umbral", () => {
    expect(priceDropMessage({ ...base, reason: "threshold", threshold: 1.65 }).body).toContain("tu precio objetivo (1,650 €/l)")
  })
})
