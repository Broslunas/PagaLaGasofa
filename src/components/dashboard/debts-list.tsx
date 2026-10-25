"use client"

import { Check, ChevronDown, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { formatCents } from "@/lib/format"

export interface DebtorView {
  key: string
  name: string
  totalCents: number
  trips: { shareId: string; title: string | null; createdAt: string; amountCents: number }[]
}

const date = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" })

export function DebtsList({ debtors, origin }: { debtors: DebtorView[]; origin: string }) {
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function settle(key: string) {
    setBusy(true)
    setError(null)
    const res = await fetch("/api/dashboard/debts/settle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) }).catch(() => null)
    setBusy(false)
    if (!res?.ok) return setError("No se pudo marcar como pagado.")
    setConfirming(null)
    router.refresh()
  }

  function reminder(d: DebtorView) {
    const lines = d.trips.slice(0, 5).map((t) => `· ${t.title || "Viaje"} (${date.format(new Date(t.createdAt))}): ${formatCents(t.amountCents)} → ${origin}/t/${t.shareId}`)
    const text = `Hola ${d.name}, me debes ${formatCents(d.totalCents)} de gasolina:\n${lines.join("\n")}`
    return `https://wa.me/?text=${encodeURIComponent(text)}`
  }

  if (debtors.length === 0) {
    return (
      <div className="space-y-2 rounded-2xl border border-dashed p-8 text-center">
        <p className="flex items-center justify-center gap-2 font-medium"><Check className="size-5 text-success" /> Estás al día</p>
        <p className="text-sm text-muted-foreground">Nadie te debe nada de tus viajes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {debtors.map((d) => {
          const expanded = open === d.key
          return (
            <li key={d.key} className="rounded-2xl border bg-card">
              <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : d.key)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{d.name}</span>
                  <span className="block text-xs text-muted-foreground">{d.trips.length} {d.trips.length === 1 ? "viaje pendiente" : "viajes pendientes"}</span>
                </span>
                <span className="text-lg font-semibold tabular-nums">{formatCents(d.totalCents)}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <div className="space-y-3 border-t p-4">
                  <ul className="space-y-1.5 text-sm">
                    {d.trips.map((t) => (
                      <li key={t.shareId} className="flex justify-between gap-3">
                        <Link href={`/t/${t.shareId}`} className="min-w-0 truncate underline-offset-4 hover:underline">
                          {t.title || "Viaje"} <span className="text-muted-foreground">· {date.format(new Date(t.createdAt))}</span>
                        </Link>
                        <span className="tabular-nums">{formatCents(t.amountCents)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={reminder(d)} target="_blank" rel="noopener noreferrer"><MessageCircle /> Recordar por WhatsApp</a>
                    </Button>
                    {confirming === d.key ? (
                      <>
                        <Button size="sm" disabled={busy} onClick={() => settle(d.key)}>Sí, marcar todo como pagado</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Cancelar</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(d.key)}><Check /> Ya me ha pagado todo</Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p role="alert" className="min-h-4 text-sm text-destructive">{error}</p>
    </div>
  )
}
