"use client"

import { Copy, KeyRound, Trash2, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { TextInput } from "@/components/trip/fields"
import { Button } from "@/components/ui/button"

interface Props {
  shareId: string
  title: string
  manageLink: string | null
  signedIn: boolean
  /** El ticket ya pertenece a una cuenta (la tuya). */
  owned: boolean
  expiresLabel: string | null
}

export function ManagerPanel({ shareId, title, manageLink, signedIn, owned, expiresLabel }: Props) {
  const router = useRouter()
  const [name, setName] = useState(title)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  async function call(path: string, init: RequestInit, okText: string) {
    setBusy(true)
    setMessage(null)
    const res = await fetch(path, init).catch(() => null)
    setBusy(false)
    if (res?.ok) {
      setMessage({ text: okText, ok: true })
      router.refresh()
      return true
    }
    setMessage({ text: ((await res?.json().catch(() => null))?.error as string) ?? "No se pudo completar", ok: false })
    return false
  }

  async function copyManageLink() {
    if (!manageLink) return
    try {
      await navigator.clipboard.writeText(manageLink)
      setMessage({ text: "Enlace de gestión copiado. No lo compartas: da control total del ticket.", ok: true })
    } catch {
      window.prompt("Copia el enlace de gestión (no lo compartas):", manageLink)
    }
  }

  return (
    <section aria-labelledby="manage-h" className="space-y-3 rounded-2xl border bg-primary-soft/50 p-4">
      <h2 id="manage-h" className="flex items-center gap-2 text-sm font-semibold">
        <KeyRound className="size-4" /> Gestionas este ticket
      </h2>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void call(`/api/trips/${shareId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: name }),
          }, "Título guardado")
        }}
      >
        <TextInput aria-label="Título del ticket" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Título (opcional)" />
        <Button type="submit" variant="secondary" disabled={busy || name.trim() === title}>
          Guardar
        </Button>
      </form>

      {manageLink && (
        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={copyManageLink}>
            <Copy /> Copiar enlace de gestión
          </Button>
          <p className="text-xs text-muted-foreground">
            Úsalo para gestionar el ticket desde otro dispositivo. Los demás solo ven el enlace normal.
          </p>
        </div>
      )}

      {!owned && (
        <div className="space-y-1">
          {signedIn ? (
            <Button type="button" variant="outline" size="sm" disabled={busy}
              onClick={() => call(`/api/trips/${shareId}/claim`, { method: "POST" }, "Guardado en tu cuenta")}>
              <UserRound /> Guardar en mi cuenta
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={`/login?next=/t/${shareId}`}>
                <UserRound /> Inicia sesión para guardarlo
              </Link>
            </Button>
          )}
          {expiresLabel && (
            <p className="text-xs text-muted-foreground">Sin cuenta, el ticket se borra el {expiresLabel}.</p>
          )}
        </div>
      )}

      <div>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="destructive" size="sm" disabled={busy}
              onClick={async () => {
                if (await call(`/api/trips/${shareId}`, { method: "DELETE" }, "Ticket eliminado")) router.push("/viaje")
              }}>
              Sí, eliminar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Eliminar ticket
          </Button>
        )}
      </div>

      <p role="status" aria-live="polite" className={`min-h-4 text-xs ${message?.ok === false ? "text-destructive" : "text-success"}`}>
        {message?.text}
      </p>
    </section>
  )
}
