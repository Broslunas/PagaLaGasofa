"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { timeAgo } from "@/lib/format/time-ago"
import { cn } from "@/lib/utils"

interface Item {
  id: string
  title: string
  body: string
  url: string | null
  readAt: string | null
  createdAt: string
}

const REFRESH_MS = 120_000

/** `null` si no hay sesión o falla la red: se conserva lo último que se vio. */
async function fetchNotifications(signal: AbortSignal) {
  try {
    const res = await fetch("/api/notifications?limit=10", { signal })
    return res.ok ? ((await res.json()) as { notifications: Item[]; unread: number }) : null
  } catch {
    return null
  }
}

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const load = () =>
      fetchNotifications(controller.signal).then((data) => {
        if (!data) return
        setItems(data.notifications)
        setUnread(data.unread)
      })
    void load()
    const timer = setInterval(() => document.visibilityState === "visible" && void load(), REFRESH_MS)
    const onVisible = () => document.visibilityState === "visible" && void load()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      controller.abort()
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  async function markRead(ids: string[] | "all") {
    setItems((list) => list.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)))
    setUnread((u) => (ids === "all" ? 0 : Math.max(0, u - ids.length)))
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids === "all" ? { all: true } : { ids }),
    }).catch(() => {})
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notificaciones: ${unread} sin leer` : "Notificaciones"}>
          <Bell />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markRead("all")}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aquí verás las bajadas de precio de tus gasolineras favoritas.
          </p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {items.map((n) => {
              const content = (
                <>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-primary")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", !n.readAt && "font-semibold")}>{n.title}</span>
                    <span className="block text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                </>
              )
              const className = "flex gap-2 px-3 py-2.5 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              return (
                <li key={n.id}>
                  {n.url ? (
                    <Link href={n.url} className={className} onClick={() => { void markRead([n.id]); setOpen(false) }}>
                      {content}
                    </Link>
                  ) : (
                    <button type="button" className={cn(className, "w-full")} onClick={() => markRead([n.id])}>
                      {content}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div className="border-t px-3 py-2 text-center">
          <Link href="/ajustes/notificaciones" className="text-xs text-muted-foreground underline-offset-4 hover:underline" onClick={() => setOpen(false)}>
            Ajustes de notificaciones
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
