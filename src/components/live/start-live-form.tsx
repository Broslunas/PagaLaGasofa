"use client"

import { Loader2, Radio } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Field, TextInput } from "@/components/trip/fields"
import { Button } from "@/components/ui/button"
import { DEFAULT_DURATION_H, DURATION_OPTIONS_H } from "@/lib/live/logic"

/** Crea una sesión independiente de un viaje. `tripShareId` la vincula a un ticket que gestionas. */
export function StartLiveForm({ tripShareId }: { tripShareId?: string }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [hours, setHours] = useState<number>(DEFAULT_DURATION_H)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch("/api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || undefined, hours, tripShareId }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (!res?.ok || !data?.shareId) {
      setBusy(false)
      return setError(data?.error ?? "No se pudo crear la sesión. Inténtalo de nuevo.")
    }
    router.push(`/en-vivo/${data.shareId}`)
  }

  return (
    <form onSubmit={start} className="space-y-4">
      {!tripShareId && (
        <Field label="Nombre (opcional)" hint="Lo verán quienes abran el enlace.">
          {({ id, describedBy }) => (
            <TextInput id={id} aria-describedby={describedBy} value={title} maxLength={60} placeholder="Voy hacia Valencia" onChange={(e) => setTitle(e.target.value)} />
          )}
        </Field>
      )}
      <Field label="Durante cuánto tiempo">
        {({ id }) => (
          <select id={id} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-base">
            {DURATION_OPTIONS_H.map((h) => (
              <option key={h} value={h}>{h} {h === 1 ? "hora" : "horas"}</option>
            ))}
          </select>
        )}
      </Field>
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Radio />} {tripShareId ? "Compartir ubicación en vivo" : "Crear enlace"}
      </Button>
      <p role="alert" className="min-h-4 text-sm text-destructive">{error}</p>
    </form>
  )
}
