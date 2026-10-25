import { timingSafeEqual } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"

import { getDb } from "@/db"
import { runPriceAlerts } from "@/lib/notify/run-alerts"
import { syncStations } from "@/lib/stations/sync"

export const maxDuration = 60

/** Comparación en tiempo constante; rechaza si `CRON_SECRET` no está definido (nunca «Bearer undefined»). */
function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) return false
  const given = request.headers.get("authorization") ?? ""
  const expected = `Bearer ${secret}`
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

async function handle(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const result = await syncStations(getDb().$client)
    // Las alertas se revisan con los precios recién sincronizados; un fallo aquí no invalida la sincronización.
    const alerts = await runPriceAlerts().catch((error) => {
      console.error("runPriceAlerts", error)
      return { checked: 0, notified: 0, error: (error as Error).message }
    })
    return NextResponse.json({ ok: true, ...result, alerts })
  } catch (error) {
    console.error("sync-stations", error)
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 502 })
  }
}

export const GET = handle
export const POST = handle
