// Sincronización manual de gasolineras (la automática la hace /api/cron/sync-stations).
//   pnpm db:sync-stations
import postgres from "postgres"

import { syncStations } from "../src/lib/stations/sync"

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 })
try {
  const result = await syncStations(sql)
  console.log(`✓ ${result.stations} estaciones · día ${result.day} · ${(result.ms / 1000).toFixed(1)} s`)
} finally {
  await sql.end()
}
