"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ticket/copy-link-button";
import { Loader2, Radio, Square } from "lucide-react";

type Share = { shareId: string; expiresAt: string };

const THROTTLE_MS = 9000; // no mandar PATCH en cada tick del GPS, solo cada ~9s.

export function LiveShareControl({ initialShare }: { initialShare: Share | null }) {
  const [share, setShare] = useState<Share | null>(initialShare);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  async function start() {
    setError("");
    try {
      const res = await fetch("/api/live-share", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al iniciar la compartición");
      setShare(data);

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          if (now - lastSentRef.current < THROTTLE_MS) return;
          lastSentRef.current = now;
          fetch(`/api/live-share/${data.shareId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(() => {});
        },
        () => setError("No se pudo acceder a tu ubicación"),
        { enableHighAccuracy: true }
      );
      watchIdRef.current = id;
      setWatching(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar la compartición");
    }
  }

  async function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
    if (share) {
      await fetch(`/api/live-share/${share.shareId}`, { method: "DELETE" }).catch(() => {});
    }
    setShare(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {!share ? (
        <Button type="button" onClick={start}>
          <Radio /> Empezar a compartir mi ubicación
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {watching ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
            {watching ? "Compartiendo en directo" : "Sesión activa (el envío se ha detenido)"}
          </span>
          <CopyLinkButton shareId={share.shareId} basePath="/live" />
          <Button type="button" variant="outline" onClick={stop}>
            <Square /> Dejar de compartir
          </Button>
          {!watching && (
            <Button type="button" variant="outline" size="sm" onClick={start}>
              Reanudar envío
            </Button>
          )}
        </div>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
      <p className="text-xs text-muted-foreground">
        Se comparte solo tu posición en el mapa (sin nombre) durante un máximo de 4 horas. Cualquiera con el enlace
        puede verla mientras esté activa.
      </p>
    </div>
  );
}
