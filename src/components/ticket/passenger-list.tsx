"use client"

import { Check, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Switch } from "@/components/ui/switch"
import { formatCents } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface PassengerView {
  position: number
  name: string
  amountCents: number
  hasPaid: boolean
}

export function PassengerList({
  shareId,
  passengers,
  manager,
  driverPays,
}: {
  shareId: string
  passengers: PassengerView[]
  manager: boolean
  driverPays: boolean
}) {
  const router = useRouter()
  const [optimistic, setOptimistic] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  async function toggle(position: number, hasPaid: boolean) {
    setError(null)
    setOptimistic((o) => ({ ...o, [position]: hasPaid }))
    try {
      const res = await fetch(`/api/trips/${shareId}/passengers/${position}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasPaid }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo guardar")
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      // Con los datos del servidor ya actualizados (o tras un error) se descarta el valor provisional.
      setOptimistic((o) => Object.fromEntries(Object.entries(o).filter(([key]) => Number(key) !== position)))
    }
  }

  return (
    <div>
      <ul className="divide-y rounded-xl border bg-card">
        {passengers.map((p) => {
          const isDriver = p.position === 0
          const settles = !isDriver && p.amountCents > 0
          const paid = optimistic[p.position] ?? p.hasPaid
          return (
            <li key={p.position} className="flex items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isDriver ? (driverPays ? "Conductor · pone el coche" : "Conductor · invitado") : null}
                  {settles && (paid ? "Pagado" : "Pendiente de pago")}
                  {!isDriver && !settles && "Sin importe"}
                </p>
              </div>
              <p className={cn("text-lg font-semibold tabular-nums", paid && settles && "text-muted-foreground line-through")}>
                {formatCents(p.amountCents)}
              </p>
              {settles &&
                (manager ? (
                  <Switch
                    checked={paid}
                    onCheckedChange={(value) => toggle(p.position, value)}
                    aria-label={`${p.name} ha pagado`}
                  />
                ) : (
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      paid ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {paid ? <Check className="size-4" /> : <Clock className="size-4" />}
                  </span>
                ))}
            </li>
          )
        })}
      </ul>
      <p role="alert" className="mt-2 min-h-4 text-xs text-destructive">
        {error}
      </p>
    </div>
  )
}
