// Normalización de los datos de la EEA para el catálogo de coches.
// Archivo autocontenido (sin alias ni dependencias) para poder usarlo también desde scripts de Node.

export type CatalogFuel = "gasolina95" | "diesel" | "electrico"

const FUEL_BY_EEA: Record<string, CatalogFuel> = {
  PETROL: "gasolina95",
  DIESEL: "diesel",
  ELECTRIC: "electrico",
}

const MAKE_OVERRIDES: Record<string, string> = {
  VW: "Volkswagen",
  VOLKSWAGEN: "Volkswagen",
  "MERCEDES-BENZ": "Mercedes-Benz",
  MERCEDES: "Mercedes-Benz",
  "ALFA ROMEO": "Alfa Romeo",
  "LAND ROVER": "Land Rover",
  "ROLLS-ROYCE": "Rolls-Royce",
  "ASTON MARTIN": "Aston Martin",
  "DS AUTOMOBILES": "DS",
  CITROEN: "Citroën",
  SKODA: "Škoda",
  BMW: "BMW",
  MG: "MG",
  DS: "DS",
  BYD: "BYD",
  SEAT: "SEAT",
  MINI: "MINI",
  KIA: "Kia",
  GAC: "GAC",
}

/** Mayúsculas en iniciales y siglas cortas o con dígitos (ID.3, T-ROC → T-Roc, 308 SW). */
export function titleCaseModel(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => {
          if (part.length === 0) return part
          if (/\d/.test(part) || part.length <= 2) return part.toUpperCase()
          return part[0].toUpperCase() + part.slice(1).toLowerCase()
        })
        .join("-"),
    )
    .join(" ")
}

export function normalizeMake(value: string): string {
  const key = value.trim().replace(/\s+/g, " ").toUpperCase()
  return MAKE_OVERRIDES[key] ?? titleCaseModel(key)
}

export interface EeaRow {
  Mk: string | null
  Cn: string | null
  Ft: string | null
  regs: number
  fc: number | null
  z: number | null
  co2: number | null
  yr: number
}

export interface CatalogEntry {
  make: string
  model: string
  fuelType: CatalogFuel
  consumptionPer100km: number
  co2GramsPerKm: number | null
  registrations: number
  dataYear: number
}

/** Convierte una fila agregada de la EEA en una entrada del catálogo, o `null` si no sirve. */
export function toCatalogEntry(row: EeaRow): CatalogEntry | null {
  const fuelType = row.Ft ? FUEL_BY_EEA[row.Ft] : undefined
  if (!fuelType || !row.Mk || !row.Cn) return null

  // Eléctricos: Z viene en Wh/km → kWh/100 km. Resto: Fc ya está en l/100 km.
  const raw = fuelType === "electrico" ? (row.z === null ? null : row.z / 10) : row.fc
  if (raw === null || !Number.isFinite(raw)) return null
  const consumption = Math.round(raw * 100) / 100
  const [min, max] = fuelType === "electrico" ? [8, 45] : [2, 25]
  if (consumption < min || consumption > max) return null

  const make = normalizeMake(row.Mk)
  let model = titleCaseModel(row.Cn)
  // Algunos fabricantes repiten la marca en el nombre comercial («Toyota Corolla» bajo Toyota).
  if (model.toLowerCase().startsWith(`${make.toLowerCase()} `)) model = model.slice(make.length + 1)
  if (!model) return null

  return {
    make,
    model,
    fuelType,
    consumptionPer100km: consumption,
    co2GramsPerKm: row.co2 !== null && Number.isFinite(row.co2) ? Math.round(row.co2) : null,
    registrations: Math.round(row.regs),
    dataYear: row.yr,
  }
}

/** Une entradas con la misma clave (p. ej. marcas escritas distinto) ponderando por matriculaciones. */
export function mergeEntries(entries: CatalogEntry[]): CatalogEntry[] {
  const merged = new Map<string, CatalogEntry>()
  for (const e of entries) {
    const key = `${e.make}|${e.model}|${e.fuelType}`.toLowerCase()
    const prev = merged.get(key)
    if (!prev) {
      merged.set(key, { ...e })
      continue
    }
    const total = prev.registrations + e.registrations
    const weighted = (a: number, b: number) =>
      total === 0 ? a : Math.round(((a * prev.registrations + b * e.registrations) / total) * 100) / 100
    prev.consumptionPer100km = weighted(prev.consumptionPer100km, e.consumptionPer100km)
    prev.registrations = total
    prev.dataYear = Math.max(prev.dataYear, e.dataYear)
  }
  return [...merged.values()]
}
