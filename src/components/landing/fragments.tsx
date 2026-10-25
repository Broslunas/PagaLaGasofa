import QRCode from "qrcode"

import { formatCents } from "@/lib/format"
import { SAMPLE } from "@/lib/landing-sample"
import { cn } from "@/lib/utils"

/** Fragmentos de la interfaz real, dibujados en HTML con datos de ejemplo. */

export function TicketFragment({ className }: { className?: string }) {
  const { result, people } = SAMPLE
  return (
    <div data-ui className={cn("rounded-3xl bg-card p-6 text-card-foreground sm:p-8", className)} aria-label="Ejemplo de ticket de viaje">
      <p className="text-sm text-muted-foreground">{SAMPLE.km} km · gasolina 95</p>
      <p className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">{SAMPLE.from} → {SAMPLE.to}</p>
      <p className="mt-6 text-sm text-muted-foreground">Total del viaje</p>
      <p className="font-heading text-6xl leading-none font-semibold tabular-nums sm:text-7xl">{formatCents(result.totalCents)}</p>
      <ul className="mt-8 space-y-4">
        {people.map((p, i) => (
          <li key={p.name} className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-lg font-medium">{p.name}</span>
              <span className="block text-sm text-muted-foreground">{p.role}</span>
            </span>
            <span className="text-right">
              <span className="block text-xl font-semibold tabular-nums">{formatCents(result.amountsCents[i])}</span>
              {p.paid !== null && (
                <span className={cn("block text-sm", p.paid ? "text-success" : "text-muted-foreground")}>{p.paid ? "Pagado" : "Pendiente"}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Quién va a bordo en cada tramo: la idea del reparto por tramos, dibujada. */
export function LegsFragment({ className }: { className?: string }) {
  const rows = [
    { name: "Ana", note: "conduce", from: 0, to: 2, tone: "bg-primary" },
    { name: "Luis", note: "", from: 0, to: 2, tone: "bg-primary" },
    { name: "Eva", note: "sube en Cuenca", from: 1, to: 2, tone: "bg-fuel" },
  ]
  return (
    <div data-ui className={cn("rounded-3xl bg-card p-6 sm:p-8", className)} aria-label="Quién va a bordo en cada tramo">
      <div className="grid grid-cols-[5.5rem_1fr_1fr] items-end gap-x-2 text-sm text-muted-foreground">
        <span />
        <span>Madrid</span>
        <span className="flex justify-between"><span>Cuenca</span><span>Valencia</span></span>
      </div>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.name} className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-x-2">
            <span className="font-medium">{r.name}</span>
            {[0, 1].map((leg) => (
              <span key={leg} className={cn("h-7 rounded-full", leg >= r.from && leg < r.to ? r.tone : "bg-muted")} />
            ))}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted-foreground">Eva solo paga el tramo en el que va en el coche.</p>
    </div>
  )
}

export function StationsFragment({ className }: { className?: string }) {
  const stations = [
    { name: "Ballenoil", place: "Requena", off: "a 1,1 km de la ruta", price: "1,669", best: true },
    { name: "Plenergy", place: "Tarancón", off: "a 0,8 km de la ruta", price: "1,699", best: false },
    { name: "Repsol", place: "Cuenca", off: "a 0,3 km de la ruta", price: "1,759", best: false },
  ]
  return (
    <div data-ui className={cn("rounded-3xl bg-card p-6 sm:p-8", className)} aria-label="Ejemplo de gasolineras en la ruta">
      <p className="font-heading text-xl font-semibold">Gasolineras en tu ruta</p>
      <ul className="mt-4 space-y-4">
        {stations.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-medium">{s.name} · {s.place}</span>
              <span className="block text-sm text-muted-foreground">{s.off}</span>
            </span>
            <span className={cn("text-2xl font-semibold tabular-nums", s.best && "text-success")}>{s.price}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted-foreground">Datos de ejemplo.</p>
    </div>
  )
}

export async function PaidFragment({ className }: { className?: string }) {
  const svg = await QRCode.toString("https://pagalagasofa.broslunas.com", { type: "svg", margin: 0, color: { dark: "#10231f", light: "#ffffff" } })
  return (
    <div data-ui className={cn("flex items-center gap-6 rounded-3xl bg-card p-6 sm:p-8", className)} aria-label="Ejemplo de pagos y código QR">
      <div
        role="img"
        aria-label="Código QR de ejemplo"
        className="size-32 shrink-0 rounded-xl bg-white p-2 [&>svg]:size-full sm:size-36"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="min-w-0">
        <p className="font-heading text-3xl font-semibold tabular-nums">1 de 2</p>
        <p className="text-muted-foreground">han pagado</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted" role="presentation">
          <div className="h-full w-1/2 rounded-full bg-success" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Faltan {formatCents(SAMPLE.result.amountsCents[2])}</p>
      </div>
    </div>
  )
}
