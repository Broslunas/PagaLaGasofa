import { describe, expect, it } from "vitest"

import { mergeEntries, normalizeMake, titleCaseModel, toCatalogEntry, type EeaRow } from "./normalize"

const row = (over: Partial<EeaRow> = {}): EeaRow => ({
  Mk: "SEAT", Cn: "IBIZA", Ft: "PETROL", regs: 1000, fc: 5.4, z: null, co2: 123, yr: 2022, ...over,
})

describe("catalog normalize", () => {
  it("normaliza nombres", () => {
    expect(titleCaseModel("T-ROC")).toBe("T-Roc")
    expect(titleCaseModel("ID.3")).toBe("ID.3")
    expect(titleCaseModel("BERLINGO MULTISPACE")).toBe("Berlingo Multispace")
    expect(titleCaseModel("308  SW")).toBe("308 SW")
    expect(normalizeMake("vw")).toBe("Volkswagen")
    expect(normalizeMake("CITROEN")).toBe("Citroën")
    expect(normalizeMake("TOYOTA")).toBe("Toyota")
    expect(normalizeMake("BMW")).toBe("BMW")
  })

  it("convierte gasolina y diésel con su consumo", () => {
    expect(toCatalogEntry(row())).toMatchObject({ make: "SEAT", model: "Ibiza", fuelType: "gasolina95", consumptionPer100km: 5.4, co2GramsPerKm: 123 })
    expect(toCatalogEntry(row({ Ft: "DIESEL", fc: 4.8 }))?.fuelType).toBe("diesel")
  })

  it("quita la marca repetida del modelo", () => {
    expect(toCatalogEntry(row({ Mk: "TOYOTA", Cn: "TOYOTA COROLLA" }))?.model).toBe("Corolla")
    expect(toCatalogEntry(row({ Mk: "SEAT", Cn: "SEATO" }))?.model).toBe("Seato")
  })

  it("convierte Wh/km a kWh/100 km en eléctricos", () => {
    const e = toCatalogEntry(row({ Mk: "TESLA", Cn: "MODEL 3", Ft: "ELECTRIC", fc: null, z: 143.6 }))
    expect(e).toMatchObject({ fuelType: "electrico", consumptionPer100km: 14.36 })
  })

  it("descarta combustibles no soportados y datos absurdos", () => {
    expect(toCatalogEntry(row({ Ft: "PETROL/ELECTRIC" }))).toBeNull()
    expect(toCatalogEntry(row({ Ft: "HYDROGEN" }))).toBeNull()
    expect(toCatalogEntry(row({ fc: null }))).toBeNull()
    expect(toCatalogEntry(row({ fc: 0.4 }))).toBeNull()
    expect(toCatalogEntry(row({ Ft: "ELECTRIC", fc: null, z: 5 }))).toBeNull()
    expect(toCatalogEntry(row({ Cn: null }))).toBeNull()
  })

  it("mergeEntries pondera por matriculaciones", () => {
    const a = toCatalogEntry(row({ regs: 300, fc: 5 }))!
    const b = toCatalogEntry(row({ regs: 100, fc: 6 }))!
    const [m] = mergeEntries([a, b])
    expect(m.registrations).toBe(400)
    expect(m.consumptionPer100km).toBe(5.25)
  })
})
