"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, Radio } from "lucide-react";

const LiveMap = dynamic(() => import("./live-map").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Cargando mapa…</div>
  ),
});

type Position = { lat: number; lng: number; updatedAt: string };

// Poll simple cada 5s — sin websockets, la app no tiene infraestructura para
// eso y a esta frecuencia no hace falta.
export function LiveViewer({ shareId }: { shareId: string }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/live-share/${shareId}`, { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          setEnded(true);
          return;
        }
        const data = await res.json();
        if (typeof data.lat === "number" && typeof data.lng === "number") {
          setPosition({ lat: data.lat, lng: data.lng, updatedAt: data.updatedAt });
        }
      } catch {
        // fallo puntual de red: se reintenta en el próximo tick, no se marca "terminado"
      }
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [shareId]);

  if (ended) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-border/60 text-center text-sm text-muted-foreground">
        <MapPin className="text-muted-foreground" />
        Esta ubicación ya no está disponible.
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border/60 text-sm text-muted-foreground">
        Esperando la primera ubicación…
      </div>
    );
  }

  const staleMs = Date.now() - new Date(position.updatedAt).getTime();
  const stale = staleMs > 30000;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <Radio size={14} className="text-primary" />
        <span className="font-medium">Ubicación en vivo</span>
        {stale && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle size={12} /> Puede estar desactualizada
          </span>
        )}
      </div>
      <div className="h-80 w-full overflow-hidden rounded-lg border border-border/60">
        <LiveMap lat={position.lat} lng={position.lng} />
      </div>
    </div>
  );
}
