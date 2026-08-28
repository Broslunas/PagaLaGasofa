"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// beforeinstallprompt no es estándar cross-browser (Chromium-only); en iOS Safari
// no dispara nunca, así que ahí mostramos la instrucción manual de "Compartir > Añadir".
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone || sessionStorage.getItem("plg-install-dismissed")) return;

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window));
    setDismissed(false);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("plg-install-dismissed", "1");
  }

  async function install() {
    if (!deferredPrompt) return;
    // @ts-expect-error -- BeforeInstallPromptEvent no está en el lib.dom estándar
    deferredPrompt.prompt();
    setDeferredPrompt(null);
    dismiss();
  }

  if (dismissed || (!deferredPrompt && !isIOS)) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-lg sm:inset-x-auto sm:right-4 sm:w-80">
      <div className="text-sm">
        <p className="font-medium">Instala PagaLaGasofa</p>
        <p className="text-muted-foreground">
          {isIOS
            ? 'Toca compartir y luego "Añadir a inicio".'
            : "Añádela a tu pantalla de inicio, funciona sin conexión."}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!isIOS && (
          <Button size="icon-sm" onClick={install} aria-label="Instalar app">
            <Download />
          </Button>
        )}
        <Button size="icon-sm" variant="ghost" onClick={dismiss} aria-label="Cerrar">
          <X />
        </Button>
      </div>
    </div>
  );
}
