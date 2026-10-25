import QRCode from "qrcode"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { PassengerList } from "@/components/ticket/passenger-list"
import { ManageCapture } from "@/components/ticket/manage-capture"
import { ManagerPanel } from "@/components/ticket/manager-panel"
import { TicketActions } from "@/components/ticket/ticket-actions"
import { TicketLive } from "@/components/ticket/ticket-live"
import { TicketMap } from "@/components/ticket/ticket-map"
import { Button } from "@/components/ui/button"
import { formatCents, formatNumber } from "@/lib/format"
import { siteOrigin } from "@/lib/site"
import { FUEL_INFO } from "@/lib/trip/fuel"
import { manageUrl, mapsDirectionsUrl, shareMessage, tripTitle, whatsappUrl } from "@/lib/trip/share"
import { paymentProgress } from "@/lib/trip/payments"
import { loadTicket, resolveAccess } from "@/lib/trip/ticket"

export async function generateMetadata({ params }: PageProps<"/t/[shareId]">): Promise<Metadata> {
  const lookup = await loadTicket((await params).shareId)
  if (lookup.status !== "ok") return { title: "Ticket de viaje", robots: { index: false } }
  const title = tripTitle(lookup.trip.title, lookup.trip.stops)
  return {
    title,
    description: `${formatCents(lookup.trip.totalCents)} de gasolina repartidos entre ${lookup.passengers.length} personas.`,
    robots: { index: false, follow: false },
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      <Button asChild>
        <Link href="/viaje">Calcular un viaje</Link>
      </Button>
    </div>
  )
}

async function TicketBody({ params }: { params: Promise<{ shareId: string }> }) {
  const lookup = await loadTicket((await params).shareId)
  if (lookup.status === "missing") notFound()
  if (lookup.status === "expired") {
    return <Notice title="Este ticket ha caducado" body="Los tickets creados sin cuenta se borran pasado un año." />
  }

  const { trip, passengers } = lookup
  const [access, origin] = await Promise.all([resolveAccess(trip), siteOrigin()])
  const url = `${origin}/t/${trip.shareId}`
  const title = tripTitle(trip.title, trip.stops)
  const message = shareMessage({ title, totalCents: trip.totalCents, url })
  const progress = paymentProgress(passengers)
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#10231f", light: "#ffffff" } })
  const info = FUEL_INFO[trip.fuelType]
  const percentPaid = progress.totalCount ? Math.round((progress.paidCents / (progress.paidCents + progress.pendingCents || 1)) * 100) : 0
  const expiresLabel =
    trip.expiresAt && !trip.userId ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(trip.expiresAt) : null

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_24rem]">
      <ManageCapture shareId={trip.shareId} />
      <TicketLive shareId={trip.shareId} />

      <div className="space-y-6 lg:col-start-1">
        <header className="space-y-1">
          <h1 className="text-balance text-3xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(trip.distanceKm)} km{trip.isRoundTrip ? " · ida y vuelta" : ""} ·{" "}
            {new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(trip.createdAt)}
          </p>
        </header>

        <div className="h-64 overflow-hidden rounded-2xl border sm:h-80">
          <TicketMap stops={trip.stops} geometry={trip.geometry} />
        </div>

        <dl className="space-y-1.5 rounded-2xl border bg-card p-4">
          <Row label={`${info.label} (${formatNumber(trip.energyUnits)} ${info.unit})`} value={formatCents(trip.energyCents)} />
          {trip.tollsCents > 0 && <Row label="Peajes" value={formatCents(trip.tollsCents)} />}
          {trip.extras.map((e, i) => (
            <Row key={i} label={e.label} value={formatCents(e.amountCents)} />
          ))}
          <div className="flex items-baseline justify-between border-t pt-2 font-semibold">
            <dt>Total</dt>
            <dd className="text-xl tabular-nums">{formatCents(trip.totalCents)}</dd>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">Emisiones estimadas: {formatNumber(trip.co2Kg)} kg de CO₂</p>
        </dl>
      </div>

      <aside className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <section aria-labelledby="pay-h" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 id="pay-h" className="text-lg font-semibold">Cada uno paga</h2>
            {progress.totalCount > 0 && (
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {progress.paidCount} de {progress.totalCount} han pagado
              </span>
            )}
          </div>
          {progress.totalCount > 0 && (
            <div role="progressbar" aria-valuenow={percentPaid} aria-valuemin={0} aria-valuemax={100} aria-label="Pagos recibidos"
              className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${percentPaid}%` }} />
            </div>
          )}
          <PassengerList
            shareId={trip.shareId}
            manager={access.manager}
            driverPays={trip.driverPays}
            passengers={passengers.map((p) => ({ position: p.position, name: p.name, amountCents: p.amountCents, hasPaid: p.hasPaid }))}
          />
          {progress.pendingCents > 0 && (
            <p className="text-sm text-muted-foreground">Faltan por cobrar {formatCents(progress.pendingCents)}.</p>
          )}
        </section>

        <TicketActions
          shareId={trip.shareId}
          url={url}
          message={message}
          whatsapp={whatsappUrl(message)}
          mapsUrl={mapsDirectionsUrl(trip.stops)}
          title={title}
        />

        <details className="rounded-2xl border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Mostrar código QR</summary>
          <div
            role="img"
            aria-label="Código QR con el enlace del ticket"
            className="mx-auto mt-3 size-48 overflow-hidden rounded-lg bg-white p-2 [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </details>

        {access.manager && (
          <ManagerPanel
            shareId={trip.shareId}
            title={trip.title ?? ""}
            manageLink={access.manageToken ? manageUrl(origin, trip.shareId, access.manageToken) : null}
            signedIn={Boolean(access.userId)}
            owned={Boolean(trip.userId && trip.userId === access.userId)}
            expiresLabel={expiresLabel}
          />
        )}
      </aside>
    </div>
  )
}

export default function TicketPage({ params }: PageProps<"/t/[shareId]">) {
  return (
    <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
      <TicketBody params={params} />
    </Suspense>
  )
}
