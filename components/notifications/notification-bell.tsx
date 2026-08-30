"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeToPush } from "@/lib/push";

type Notification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user) return;
    async function poll() {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
    poll();
    const id = setInterval(poll, 60000);
    return () => clearInterval(id);
  }, [session?.user]);

  useEffect(() => {
    if (session?.user && typeof window !== "undefined" && "Notification" in window) {
      setShowPushBanner(Notification.permission === "default");
    }
  }, [session?.user]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  if (!session?.user) return null;

  return (
    <div className="relative" ref={boxRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 text-muted-foreground"
        aria-label="Notificaciones"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex size-2 rounded-full bg-primary" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-9 z-50 flex w-80 max-w-[90vw] flex-col gap-1 rounded-lg border border-border/70 bg-card/95 p-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between px-1.5 py-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Check size={12} /> Marcar todas
              </button>
            )}
          </div>

          {showPushBanner && (
            <button
              type="button"
              onClick={() => {
                subscribeToPush();
                setShowPushBanner(false);
              }}
              className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2 text-left text-xs font-medium text-primary hover:bg-primary/10"
            >
              <BellRing size={14} /> Activar notificaciones push
            </button>
          )}

          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-1.5 py-3 text-center text-xs text-muted-foreground">Sin notificaciones</p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.url ?? "#"}
                onClick={() => setOpen(false)}
                className={`flex flex-col gap-0.5 rounded-md px-2.5 py-2 text-xs transition hover:bg-muted/60 ${
                  n.read ? "" : "bg-primary/5"
                }`}
              >
                <span className="font-semibold text-foreground">{n.title}</span>
                <span className="text-muted-foreground">{n.body}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
