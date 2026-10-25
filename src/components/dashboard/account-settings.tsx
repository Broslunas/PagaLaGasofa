"use client"

import { Bell, Download, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Field, TextInput } from "@/components/trip/fields"
import { Button } from "@/components/ui/button"

export function AccountSettings() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [savedName, setSavedName] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [deleteTrips, setDeleteTrips] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/account/settings")
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as { email: string | null; displayName: string | null }
        setEmail(data.email)
        setName(data.displayName ?? "")
        setSavedName(data.displayName ?? "")
        setLoaded(true)
      })
      .catch(() => {})
  }, [])

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await fetch("/api/account/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: name }) }).catch(() => null)
    setBusy(false)
    if (res?.ok) {
      setSavedName(name.trim())
      setMessage({ text: "Nombre guardado.", ok: true })
    } else setMessage({ text: "No se pudo guardar el nombre.", ok: false })
  }

  async function deleteAccount() {
    setBusy(true)
    setDeleteError(null)
    const res = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm, deleteTrips }) }).catch(() => null)
    if (res?.ok) {
      router.replace("/")
      router.refresh()
      return
    }
    setBusy(false)
    setDeleteError((await res?.json().catch(() => null))?.error ?? "No se pudo eliminar la cuenta.")
  }

  if (!loaded) return <div className="h-48 animate-pulse rounded-2xl bg-muted" aria-busy="true" />

  return (
    <div className="space-y-6">
      <section aria-labelledby="profile-h" className="space-y-3 rounded-2xl border bg-card p-4">
        <h2 id="profile-h" className="font-semibold">Perfil</h2>
        <form onSubmit={saveName} className="space-y-3">
          <Field label="Nombre">{({ id }) => <TextInput id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />}</Field>
          <p className="text-sm text-muted-foreground">Email: {email ?? "—"}</p>
          <Button type="submit" variant="secondary" disabled={busy || !name.trim() || name.trim() === savedName}>Guardar</Button>
        </form>
        <p role="status" aria-live="polite" className={`min-h-4 text-sm ${message?.ok === false ? "text-destructive" : "text-success"}`}>{message?.text}</p>
      </section>

      <section aria-labelledby="notif-h" className="space-y-2 rounded-2xl border bg-card p-4">
        <h2 id="notif-h" className="font-semibold">Avisos</h2>
        <p className="text-sm text-muted-foreground">Alertas de precio por notificación del navegador y por email.</p>
        <Button asChild variant="outline"><Link href="/ajustes/notificaciones"><Bell /> Gestionar notificaciones</Link></Button>
      </section>

      <section aria-labelledby="data-h" className="space-y-2 rounded-2xl border bg-card p-4">
        <h2 id="data-h" className="font-semibold">Tus datos</h2>
        <p className="text-sm text-muted-foreground">Descarga una copia de todo lo que guardamos sobre ti: cuenta, vehículos, viajes, favoritas y notificaciones.</p>
        <Button asChild variant="outline"><a href="/api/account/export" download><Download /> Descargar mis datos (JSON)</a></Button>
      </section>

      <section aria-labelledby="danger-h" className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
        <h2 id="danger-h" className="flex items-center gap-2 font-semibold text-destructive"><TriangleAlert className="size-4" /> Eliminar cuenta</h2>
        {!deleting ? (
          <>
            <p className="text-sm text-muted-foreground">Se borrarán tu perfil, vehículos, favoritas, notificaciones y dispositivos. No se puede deshacer.</p>
            <Button variant="outline" onClick={() => setDeleting(true)}>Quiero eliminar mi cuenta</Button>
          </>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={deleteTrips} onChange={(e) => setDeleteTrips(e.target.checked)} className="mt-0.5 size-4 accent-[var(--destructive)]" />
              <span>
                Eliminar también mis tickets de viaje.
                <span className="block text-xs text-muted-foreground">Si no lo marcas, los tickets seguirán visibles con su enlace para quienes los recibieron y caducarán en un año.</span>
              </span>
            </label>
            <Field label="Escribe ELIMINAR para confirmar">
              {({ id }) => <TextInput id={id} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="characters" />}
            </Field>
            <div className="flex gap-2">
              <Button variant="destructive" disabled={confirm !== "ELIMINAR" || busy} onClick={deleteAccount}>Eliminar definitivamente</Button>
              <Button variant="ghost" onClick={() => { setDeleting(false); setConfirm("") }}>Cancelar</Button>
            </div>
            <p role="alert" className="min-h-4 text-sm text-destructive">{deleteError}</p>
          </div>
        )}
      </section>
    </div>
  )
}
