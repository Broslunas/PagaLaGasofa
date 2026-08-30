"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { BellRing, BellOff, Download, Laptop, Loader2, Trash2, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push";

type PushDevice = { id: string; endpoint: string; createdAt: string };

export function AccountSettings({
  user,
  initialSubscriptions,
}: {
  user: { name: string | null; email: string | null; image: string | null };
  initialSubscriptions: PushDevice[];
}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [thisEndpoint, setThisEndpoint] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Averigua si este navegador ya está entre los suscritos, para marcarlo
  // como "este dispositivo" en la lista.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setThisEndpoint(sub?.endpoint ?? null))
      .catch(() => {});
  }, []);

  async function togglePushHere() {
    setPushBusy(true);
    try {
      if (thisEndpoint) {
        await unsubscribeFromPush();
        setSubscriptions((subs) => subs.filter((s) => s.endpoint !== thisEndpoint));
        setThisEndpoint(null);
      } else {
        const sub = await subscribeToPush();
        if (sub) {
          setThisEndpoint(sub.endpoint);
          setSubscriptions((subs) => [{ id: sub.endpoint, endpoint: sub.endpoint, createdAt: new Date().toISOString() }, ...subs]);
        }
      }
    } finally {
      setPushBusy(false);
    }
  }

  async function revokeDevice(id: string) {
    setSubscriptions((subs) => subs.filter((s) => s.id !== id));
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (subscriptions.find((s) => s.id === id)?.endpoint === thisEndpoint) setThisEndpoint(null);
  }

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/account/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pagalagasofa-datos.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (!window.confirm("¿Eliminar tu cuenta y todos tus datos (vehículos, viajes, favoritos)? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    try {
      await fetch("/api/account", { method: "DELETE" });
      await signOut({ callbackUrl: "/" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <User size={16} className="text-primary" />
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? "Usuario"} width={40} height={40} className="rounded-full ring-1 ring-border" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name ?? "Usuario"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <BellRing size={16} className="text-primary" />
            Notificaciones push
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Avisos de bajada de precio en tus gasolineras favoritas, en este dispositivo.</p>
            <Button type="button" variant={thisEndpoint ? "outline" : "default"} size="sm" onClick={togglePushHere} disabled={pushBusy}>
              {pushBusy ? <Loader2 className="animate-spin" size={14} /> : thisEndpoint ? <BellOff size={14} /> : <BellRing size={14} />}
              {thisEndpoint ? "Desactivar aquí" : "Activar aquí"}
            </Button>
          </div>

          {subscriptions.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-border/50 pt-3">
              <p className="text-xs font-medium text-muted-foreground">Dispositivos con notificaciones activas</p>
              {subscriptions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Laptop size={13} />
                    {s.endpoint === thisEndpoint ? "Este dispositivo" : `Añadido el ${new Date(s.createdAt).toLocaleDateString("es-ES")}`}
                  </span>
                  <button type="button" onClick={() => revokeDevice(s.id)} className="text-muted-foreground hover:text-destructive" title="Revocar">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Download size={16} className="text-primary" />
            Exportar tus datos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Descarga un JSON con tus vehículos, viajes, favoritos y notificaciones.</p>
          <Button type="button" variant="outline" size="sm" onClick={exportData} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
            Exportar
          </Button>
        </CardContent>
      </Card>

      <Card className="ring-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-destructive">
            <Trash2 size={16} />
            Eliminar cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Borra tu cuenta y todos tus datos de forma permanente.</p>
          <Button type="button" variant="destructive" size="sm" onClick={deleteAccount} disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
            Eliminar cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
