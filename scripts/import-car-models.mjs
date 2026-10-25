// Importa el catálogo de coches desde la API pública Discodata de la EEA.
// Solo se piden filas agregadas de España (no se descarga el dataset completo).
//
//   node --env-file=.env.local scripts/import-car-models.mjs
//
// Datos: EEA, «Monitoring of CO2 emissions from passenger cars» (Reglamento UE 2019/631).
import postgres from "postgres"

import { mergeEntries, toCatalogEntry } from "../src/lib/catalog/normalize"

const ENDPOINT = "https://discodata.eea.europa.eu/sql"
const PAGE = 1000

const QUERY = `
SELECT Mk, Cn, Ft, COUNT(*) AS regs,
  AVG(CAST(Fc AS float)) AS fc,
  AVG(CAST([Z (Wh/km)] AS float)) AS z,
  AVG(CAST([Ewltp (g/km)] AS float)) AS co2,
  MAX(Year) AS yr
FROM [CO2Emission].[latest].[co2cars]
WHERE MS = 'ES'
  AND (Year = 2022 OR (Year = 2021 AND Status = 'F'))
  AND Ft IN ('PETROL', 'DIESEL', 'ELECTRIC')
  AND Fm IN ('M', 'H', 'E')
  AND Mk IS NOT NULL AND Cn IS NOT NULL
GROUP BY Mk, Cn, Ft
HAVING COUNT(*) >= 5
ORDER BY regs DESC`

async function fetchAll() {
  const rows = []
  for (let p = 1; ; p++) {
    const url = new URL(ENDPOINT)
    url.searchParams.set("query", QUERY)
    url.searchParams.set("p", String(p))
    url.searchParams.set("nrOfHits", String(PAGE))
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
    if (!res.ok) throw new Error(`Discodata ${res.status}`)
    const { results } = await res.json()
    rows.push(...results)
    console.log(`página ${p}: ${results.length} filas`)
    if (results.length < PAGE) return rows
  }
}

const rows = await fetchAll()
const entries = mergeEntries(rows.map(toCatalogEntry).filter(Boolean))
console.log(`${rows.length} filas de la EEA → ${entries.length} modelos`)
if (entries.length < 500) throw new Error("Muy pocos modelos: se aborta para no vaciar el catálogo")

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 })
try {
  // El catálogo es un dato derivado: se reemplaza entero y de forma atómica.
  await sql.begin(async (tx) => {
    await tx`delete from car_models`
    for (let i = 0; i < entries.length; i += 500) {
      const chunk = entries.slice(i, i + 500)
      await tx`
      insert into car_models (make, model, fuel_type, consumption_per_100km, co2_g_km, registrations, data_year)
      select * from unnest(
        ${chunk.map((e) => e.make)}::text[],
        ${chunk.map((e) => e.model)}::text[],
        ${chunk.map((e) => e.fuelType)}::fuel_type[],
        ${chunk.map((e) => e.consumptionPer100km)}::numeric[],
        ${chunk.map((e) => e.co2GramsPerKm)}::int[],
        ${chunk.map((e) => e.registrations)}::int[],
        ${chunk.map((e) => e.dataYear)}::smallint[]
      )
      on conflict (make, model, fuel_type) do nothing`
    }
  })
  const [{ count }] = await sql`select count(*)::int as count from car_models`
  console.log(`car_models: ${count} filas`)
} finally {
  await sql.end()
}
