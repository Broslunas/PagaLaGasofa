import { describe, expect, it } from "vitest"

import { is24h, openStatus, parseSchedule, timeZoneFor } from "./opening-hours"

// 2026-10-26 es lunes. Madrid va en CET (UTC+1) desde el 25 de octubre.
const madrid = (day: number, hh: number, mm = 0) => new Date(Date.UTC(2026, 9, day, hh - 1, mm))

describe("opening-hours", () => {
  it("24 horas", () => {
    expect(is24h("L-D: 24H")).toBe(true)
    expect(is24h("L: 24H")).toBe(false)
    expect(openStatus("L-D: 24H", madrid(26, 3))).toEqual({ open: true, label: "Abierto 24 h" })
  })

  it("abierto y cerrado en horario simple", () => {
    expect(openStatus("L-D: 07:00-22:00", madrid(26, 12))).toEqual({ open: true, label: "Abierto · cierra a las 22:00" })
    expect(openStatus("L-D: 07:00-22:00", madrid(26, 23))).toEqual({ open: false, label: "Cerrado · abre mañana a las 07:00" })
    expect(openStatus("L-D: 07:00-22:00", madrid(26, 5))).toEqual({ open: false, label: "Cerrado · abre a las 07:00" })
  })

  it("tramos partidos y días distintos", () => {
    const s = "L-V: 07:00-15:00 y 17:00-22:00; S-D: 09:00-14:00"
    expect(openStatus(s, madrid(26, 16)).open).toBe(false)
    expect(openStatus(s, madrid(26, 16)).label).toBe("Cerrado · abre a las 17:00")
    expect(openStatus(s, madrid(31, 10)).open).toBe(true) // sábado
    expect(openStatus(s, madrid(31, 15)).open).toBe(false)
  })

  it("cruza la medianoche", () => {
    const s = "L-D: 06:00-00:00"
    expect(openStatus(s, madrid(26, 23, 30)).open).toBe(true)
    const night = "L-D: 22:00-06:00"
    expect(openStatus(night, madrid(27, 2)).open).toBe(true) // madrugada del martes, tramo del lunes
    expect(openStatus(night, madrid(27, 12)).open).toBe(false)
  })

  it("un rango de días que da la vuelta a la semana", () => {
    const week = parseSchedule("S-L: 08:00-20:00")!
    expect(week.S).toHaveLength(1)
    expect(week.D).toHaveLength(1)
    expect(week.L).toHaveLength(1)
    expect(week.M).toHaveLength(0)
  })

  it("horario desconocido no rompe", () => {
    expect(openStatus("", madrid(26, 12))).toEqual({ open: null, label: "Horario no disponible" })
    expect(openStatus("cerrado por obras", madrid(26, 12)).open).toBeNull()
  })

  it("Canarias usa su zona horaria", () => {
    expect(timeZoneFor(28.1)).toBe("Atlantic/Canary")
    expect(timeZoneFor(40.4)).toBe("Europe/Madrid")
    // 12:30 UTC = 12:30 en Canarias (WET, UTC+0) pero 13:30 en Madrid
    const now = new Date(Date.UTC(2026, 9, 26, 12, 30))
    expect(openStatus("L-D: 07:00-13:00", now, "Atlantic/Canary").open).toBe(true)
    expect(openStatus("L-D: 07:00-13:00", now, "Europe/Madrid").open).toBe(false)
  })
})
