import { formatPrice } from "@/lib/format"
import { FUEL_INFO } from "@/lib/trip/fuel"
import type { StationFuel } from "@/lib/stations/types"

export interface Message {
  title: string
  body: string
  /** Ruta interna de la app. */
  url: string
}

export function priceDropMessage(opts: {
  stationId: string
  stationName: string
  locality: string
  fuel: StationFuel
  price: number
  previous: number
  reason: "threshold" | "drop"
  threshold: number | null
}): Message {
  const fuel = FUEL_INFO[opts.fuel].label
  const where = opts.locality ? `${opts.stationName} (${opts.locality})` : opts.stationName
  const diff = opts.previous - opts.price
  const body =
    opts.reason === "threshold" && opts.threshold !== null
      ? `${fuel} ha bajado a ${formatPrice(opts.price)} €/l, por debajo de tu precio objetivo (${formatPrice(opts.threshold)} €/l).`
      : `${fuel} baja ${formatPrice(diff)} €: de ${formatPrice(opts.previous)} a ${formatPrice(opts.price)} €/l.`
  return { title: `${where}: ${formatPrice(opts.price)} €/l`, body, url: `/gasolineras/${opts.stationId}` }
}
