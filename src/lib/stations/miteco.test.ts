import { describe, expect, it } from "vitest"

import { brandKey, parseMiteco, parsePrice, titleCaseEs, toStationRecord } from "./miteco"

const raw = (over: Record<string, string> = {}) => ({
  IDEESS: "4375",
  "Rótulo": "REPSOL",
  "Dirección": "AVENIDA CASTILLA LA MANCHA, 26",
  Localidad: "ABENGIBRE",
  Municipio: "Abengibre",
  Provincia: "ALBACETE",
  "C.P.": "02250",
  Latitud: "39,211417",
  "Longitud (WGS84)": "-1,539167",
  Horario: "L-D: 07:00-22:00",
  "Tipo Venta": "P",
  "Precio Gasolina 95 E5": "1,699",
  "Precio Gasoleo A": "1,829",
  "Precio Gasoleo Premium": "",
  ...over,
})

describe("miteco", () => {
  it("parsePrice", () => {
    expect(parsePrice("1,699")).toBe(1.699)
    expect(parsePrice("")).toBeNull()
    expect(parsePrice(undefined)).toBeNull()
    expect(parsePrice("0")).toBeNull()
    expect(parsePrice("99,9")).toBeNull()
  })

  it("titleCaseEs", () => {
    expect(titleCaseEs("AVENIDA CASTILLA LA MANCHA, 26")).toBe("Avenida Castilla la Mancha, 26")
    expect(titleCaseEs("CARRETERA N-340 KM 12")).toBe("Carretera N-340 km 12")
    expect(titleCaseEs("SANTA CRUZ DE TENERIFE")).toBe("Santa Cruz de Tenerife")
  })

  it("brandKey", () => {
    expect(brandKey("Repsol")).toBe("REPSOL")
    expect(brandKey("Ballenoil")).toBe("BALLENOIL")
    expect(brandKey("Nº 10.935")).toBe("")
    expect(brandKey("ESTACIÓN DE SERVICIO LA PAZ")).toBe("")
    expect(brandKey("Cepsa & Co")).toBe("CEPSA & CO")
  })

  it("convierte una estación completa", () => {
    const s = toStationRecord(raw())!
    expect(s).toMatchObject({ id: "4375", name: "Repsol", brand: "REPSOL", locality: "Abengibre", province: "Albacete", publicSale: true })
    expect(s.lat).toBeCloseTo(39.211417)
    expect(s.lng).toBeCloseTo(-1.539167)
    expect(s.prices).toEqual({ gasolina95: 1.699, gasolina98: null, diesel: 1.829, dieselPremium: null, glp: null })
  })

  it("usa E10 solo si no hay E5 y marca venta restringida", () => {
    const s = toStationRecord(raw({ "Precio Gasolina 95 E5": "", "Precio Gasolina 95 E10": "1,55", "Tipo Venta": "R" }))!
    expect(s.prices.gasolina95).toBe(1.55)
    expect(s.publicSale).toBe(false)
  })

  it("conserva las siglas en el nombre", () => {
    expect(toStationRecord(raw({ "Rótulo": "BP AVENIDA 3 DE MAYO" }))!.name).toBe("BP Avenida 3 de Mayo")
  })

  it("estación sin marca recibe un nombre descriptivo", () => {
    expect(toStationRecord(raw({ "Rótulo": "Nº 10.935" }))!).toMatchObject({ brand: "", name: "Gasolinera de Abengibre" })
  })

  it("descarta coordenadas rotas y ids vacíos", () => {
    expect(toStationRecord(raw({ Latitud: "0,0", "Longitud (WGS84)": "0,0" }))).toBeNull()
    expect(toStationRecord(raw({ Latitud: "" }))).toBeNull()
    expect(toStationRecord(raw({ IDEESS: "" }))).toBeNull()
  })

  it("parseMiteco quita duplicados y valida el resultado", () => {
    expect(parseMiteco({ ResultadoConsulta: "OK", ListaEESSPrecio: [raw(), raw(), raw({ IDEESS: "2" })] })).toHaveLength(2)
    expect(() => parseMiteco({ ResultadoConsulta: "ERROR" })).toThrow()
  })
})
