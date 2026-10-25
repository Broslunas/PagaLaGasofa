// Lectura del feed de precios de MITECO (Ministerio para la Transición Ecológica).
// Sin dependencias: se usa tanto en el servidor como en el script de sincronización.

export const MITECO_URL =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/"

export interface StationPrices {
  gasolina95: number | null
  gasolina98: number | null
  diesel: number | null
  dieselPremium: number | null
  glp: number | null
}

export interface StationRecord {
  id: string
  /** Rótulo legible («Repsol», «Estación de servicio de X»). */
  name: string
  /** Clave de marca en mayúsculas sin acentos; vacía si no hay marca reconocible. */
  brand: string
  address: string
  locality: string
  municipality: string
  province: string
  postalCode: string
  lat: number
  lng: number
  schedule: string
  /** `false` en estaciones de venta restringida (cooperativas, flotas). */
  publicSale: boolean
  prices: StationPrices
}

type RawStation = Record<string, string | undefined>

/** «1,699» → 1.699; vacío o fuera de rango razonable → null. */
export function parsePrice(value: string | undefined): number | null {
  if (!value) return null
  const n = Number(value.replace(",", "."))
  return Number.isFinite(n) && n >= 0.3 && n <= 4 ? Math.round(n * 1000) / 1000 : null
}

const parseCoord = (value: string | undefined) => (value ? Number(value.replace(",", ".")) : NaN)

const SMALL_WORDS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "en", "a", "al", "con", "por", "para"])

/** «AVENIDA CASTILLA LA MANCHA, 26» → «Avenida Castilla la Mancha, 26». */
export function titleCaseEs(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word, i) => {
      if (i > 0 && SMALL_WORDS.has(word)) return word
      if (/^(km|s\/n|n°|nº)$/.test(word)) return word
      return word.replace(/(^|[-(/.])([a-záéíóúüñ])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    })
    .join(" ")
}

/** Siglas que el title-case estropea («Bp» → «BP»). */
const fixAcronyms = (value: string) => value.replace(/\b(Bp|Gm|Ps|Eess|Ees)\b/g, (m) => m.toUpperCase())

export function brandKey(name: string): string {
  const key = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9&+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  // Estaciones sin rótulo comercial: «Nº 10.935», «ESTACION DE SERVICIO X»…
  if (!key || /^N[O0]? ?\d/.test(key) || /^(E S|ES|EESS|ESTACION)/.test(key) || /^\d/.test(key)) return ""
  return key
}

/** Dentro de España peninsular, Baleares y Canarias; descarta coordenadas rotas del feed. */
export const inSpain = (lat: number, lng: number) => lat >= 27 && lat <= 44.5 && lng >= -19 && lng <= 5.5

export function toStationRecord(raw: RawStation): StationRecord | null {
  const id = raw["IDEESS"]?.trim()
  const lat = parseCoord(raw["Latitud"])
  const lng = parseCoord(raw["Longitud (WGS84)"])
  if (!id || !Number.isFinite(lat) || !Number.isFinite(lng) || !inSpain(lat, lng)) return null

  const rawName = (raw["Rótulo"] ?? "").trim()
  const brand = brandKey(rawName)
  const locality = titleCaseEs(raw["Localidad"] ?? "")
  const name = brand ? fixAcronyms(titleCaseEs(rawName)) : `Gasolinera de ${locality || titleCaseEs(raw["Municipio"] ?? "")}`.trim()

  return {
    id,
    name,
    brand,
    address: titleCaseEs(raw["Dirección"] ?? ""),
    locality,
    municipality: titleCaseEs(raw["Municipio"] ?? ""),
    province: titleCaseEs(raw["Provincia"] ?? ""),
    postalCode: (raw["C.P."] ?? "").trim(),
    lat,
    lng,
    schedule: (raw["Horario"] ?? "").trim(),
    publicSale: (raw["Tipo Venta"] ?? "P").trim().toUpperCase() !== "R",
    prices: {
      // E5 es la gasolina estándar; E10 solo si no hay E5.
      gasolina95: parsePrice(raw["Precio Gasolina 95 E5"]) ?? parsePrice(raw["Precio Gasolina 95 E10"]),
      gasolina98: parsePrice(raw["Precio Gasolina 98 E5"]) ?? parsePrice(raw["Precio Gasolina 98 E10"]),
      diesel: parsePrice(raw["Precio Gasoleo A"]),
      dieselPremium: parsePrice(raw["Precio Gasoleo Premium"]),
      glp: parsePrice(raw["Precio Gases licuados del petróleo"]),
    },
  }
}

export function parseMiteco(feed: { ListaEESSPrecio?: RawStation[]; ResultadoConsulta?: string }): StationRecord[] {
  if (feed.ResultadoConsulta && feed.ResultadoConsulta !== "OK") throw new Error(`MITECO: ${feed.ResultadoConsulta}`)
  const seen = new Set<string>()
  const out: StationRecord[] = []
  for (const raw of feed.ListaEESSPrecio ?? []) {
    const record = toStationRecord(raw)
    if (!record || seen.has(record.id)) continue
    seen.add(record.id)
    out.push(record)
  }
  return out
}

export async function fetchMiteco(): Promise<StationRecord[]> {
  const res = await fetch(MITECO_URL, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(45_000) })
  if (!res.ok) throw new Error(`MITECO respondió ${res.status}`)
  // El feed lleva BOM UTF-8.
  const text = (await res.text()).replace(/^﻿/, "")
  return parseMiteco(JSON.parse(text))
}
