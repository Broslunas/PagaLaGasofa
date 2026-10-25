import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { InstallPrompt } from "@/components/pwa/install-prompt"
import { getDb } from "@/db"
import { getUser } from "@/lib/auth/session"
import { getSummary, listTrips } from "@/lib/dashboard/queries"
import { formatCents } from "@/lib/format"

export const metadata: Metadata = { title: "Inicio", robots: { index: false } }

const TILES = [
  { href: "/viaje", title: "Calcular un viaje", text: "Ruta, coste y reparto entre quienes van.", tone: "bg-primary text-primary-foreground" },
  { href: "/gasolineras", title: "Gasolineras cerca", text: "Precios de hoy, de la más barata a la más cara.", tone: "bg-fuel text-fuel-foreground" },
  { href: "/en-vivo", title: "Compartir mi ubicación", text: "Un enlace para que te sigan en directo.", tone: "bg-primary-soft text-foreground" },
] as const

/** Bloque personal: lo que te deben y el último viaje. Sin sesión, invita a entrar. */
async function Personal() {
  const user = await getUser()
  if (!user) {
    return (
      <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
        <Link href="/login?next=/app" className="font-medium text-foreground underline underline-offset-4">Inicia sesión</Link> para guardar tus viajes, vehículos y
        gasolineras favoritas, y para recibir avisos cuando baje el precio.
      </p>
    )
  }
  const db = getDb()
  const [summary, recent] = await Promise.all([getSummary(db, user.id), listTrips(db, user.id, { limit: 1, offset: 0 })])
  const last = recent.items[0]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link href="/dashboard/deudas" className="rounded-2xl bg-muted p-5 transition-colors hover:bg-accent">
        <p className="text-sm text-muted-foreground">Te deben</p>
        <p className="font-heading text-3xl font-semibold tabular-nums">{formatCents(summary.pendingCents)}</p>
        <p className="text-sm text-muted-foreground">{summary.pendingCents > 0 ? `${summary.pendingPeople} ${summary.pendingPeople === 1 ? "persona" : "personas"}` : "Estás al día"}</p>
      </Link>
      <Link href={last ? `/t/${last.shareId}` : "/dashboard"} className="rounded-2xl bg-muted p-5 transition-colors hover:bg-accent">
        <p className="text-sm text-muted-foreground">{last ? "Último viaje" : "Tu cuenta"}</p>
        <p className="truncate font-heading text-xl font-semibold">{last ? last.title || `${last.from} → ${last.to}` : "Todavía sin viajes"}</p>
        <p className="text-sm text-muted-foreground">{last ? formatCents(last.totalCents) : "Crea el primero"}</p>
      </Link>
    </div>
  )
}

export default function AppHome() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
      <h1 className="text-balance text-3xl font-semibold sm:text-4xl">¿Qué quieres hacer?</h1>
      <InstallPrompt />
      <ul className="grid gap-3 sm:grid-cols-3">
        {TILES.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className={`flex h-full min-h-40 flex-col justify-between rounded-3xl p-5 transition-transform active:scale-[0.98] motion-reduce:transition-none ${t.tone}`}>
              <span className="font-heading text-2xl leading-tight font-semibold">{t.title}</span>
              <span className="text-sm opacity-80">{t.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-muted" aria-busy="true" />}>
        <Personal />
      </Suspense>
    </div>
  )
}
