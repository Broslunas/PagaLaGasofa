import { describe, expect, it } from "vitest"

import { toCsv } from "./csv"
import { fillMonths, groupDebts, nameKey, type MonthRow } from "./series"

const row = (month: string, spendCents: number): MonthRow => ({ month, trips: 1, spendCents, km: 100, energyUnits: 6, co2Kg: 14, savingsCents: 0 })

describe("fillMonths", () => {
  const now = new Date("2026-10-25T10:00:00Z")
  it("12 meses consecutivos con ceros", () => {
    const out = fillMonths([row("2026-10", 500), row("2026-08", 300)], now, 12)
    expect(out).toHaveLength(12)
    expect(out[0].month).toBe("2025-11")
    expect(out[11]).toMatchObject({ month: "2026-10", spendCents: 500 })
    expect(out.find((m) => m.month === "2026-09")).toMatchObject({ trips: 0, spendCents: 0 })
  })
  it("cruza el cambio de año", () => {
    const out = fillMonths([], new Date("2026-02-10T10:00:00Z"), 3)
    expect(out.map((m) => m.month)).toEqual(["2025-12", "2026-01", "2026-02"])
  })
})

describe("groupDebts", () => {
  const d = (n: string, amountCents: number, day: number, shareId = "x") => ({ name: n, shareId, title: null, createdAt: new Date(2026, 9, day), amountCents })
  it("agrupa sin distinguir mayúsculas ni espacios y ordena por deuda", () => {
    const out = groupDebts([d("Luis", 1000, 1), d("ana ", 500, 2), d("  Ana", 700, 3), d("LUIS", 100, 4)])
    expect(out.map((x) => [x.name, x.totalCents, x.trips.length])).toEqual([["LUIS", 1100, 2], ["Ana", 1200, 2]].sort((a, b) => (b[1] as number) - (a[1] as number)))
  })
  it("el nombre mostrado es el de la deuda más reciente", () => {
    expect(groupDebts([d("luis", 100, 1), d("Luis", 100, 5)])[0].name).toBe("Luis")
  })
  it("nameKey", () => {
    expect(nameKey("  María   José ")).toBe("maría josé")
  })
})

describe("toCsv", () => {
  it("separador ; BOM, comas decimales y escape de comillas", () => {
    const csv = toCsv([{ a: 'Hola "x"', b: 12.5, c: "uno;dos" }], [
      { header: "A", value: (r) => r.a }, { header: "B", value: (r) => r.b }, { header: "C", value: (r) => r.c },
    ])
    expect(csv).toBe('﻿A;B;C\r\n"Hola ""x""";12,5;"uno;dos"\r\n')
  })
  it("neutraliza fórmulas de Excel", () => {
    const csv = toCsv([{ n: "=HYPERLINK(1)" }, { n: "+34" }], [{ header: "N", value: (r) => r.n }])
    expect(csv).toContain("'=HYPERLINK(1)")
    expect(csv).toContain("'+34")
  })
  it("valores vacíos", () => {
    expect(toCsv([{ a: null }], [{ header: "A", value: (r) => r.a }])).toBe("﻿A\r\n\r\n")
  })
})
