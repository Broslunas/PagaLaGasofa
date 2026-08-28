"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  CircleDashed,
  UserCheck,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

export interface PassengerItem {
  name: string;
  amount: number;
  hasPaid: boolean;
  pickupStop?: number | null;
  dropoffStop?: number | null;
}

export function PassengerSelector({
  passengers,
  stopLabels,
  driverName = "el conductor",
}: {
  passengers: PassengerItem[];
  stopLabels: string[];
  driverName?: string;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = selectedIdx !== null ? passengers[selectedIdx] : null;
  const isDriver = selectedIdx === 0;

  async function copyBizumConcept(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pasajeros & Bizums
          </span>
          <span className="text-xs text-muted-foreground">
            Selecciona quién eres
          </span>
        </div>

        {/* Lista seleccionable de pasajeros */}
        <div className="space-y-2">
          {passengers.map((p, i) => {
            const isSelected = selectedIdx === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIdx(isSelected ? null : i)}
                className={`w-full text-left transition-all flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg border p-3 text-sm ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border/40 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i === 0 ? "C" : i + 1}
                  </div>
                  <span className="min-w-0 font-medium break-words text-foreground">
                    {p.name}
                    {stopLabels.length > 2 &&
                      p.pickupStop != null &&
                      p.dropoffStop != null && (
                        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                          {stopLabels[p.pickupStop]} → {stopLabels[p.dropoffStop]}
                        </span>
                      )}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    {p.amount.toFixed(2)} €
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                      p.hasPaid
                        ? "bg-green-500/10 text-green-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {p.hasPaid ? (
                      <>
                        <CheckCircle2 size={12} /> Pagado
                      </>
                    ) : (
                      <>
                        <CircleDashed size={12} /> Pendiente
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sección Bizum para el pasajero seleccionado */}
        {selected && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCheck size={16} className="text-primary" />
              <span>Hola, {selected.name}</span>
            </div>

            {isDriver ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Eres el conductor. Los demás pasajeros te enviarán sus Bizums por un total de{" "}
                <span className="font-bold text-foreground">
                  {passengers
                    .slice(1)
                    .reduce((acc, cur) => acc + cur.amount, 0)
                    .toFixed(2)}{" "}
                  €
                </span>
                .
              </p>
            ) : selected.hasPaid ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 size={14} />
                <span>¡Ya estás marcado como pagado!</span>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Tu parte a pagar:</span>
                  <span className="text-xl font-black text-primary">
                    {selected.amount.toFixed(2)} €
                  </span>
                </div>

                <div className="rounded-lg bg-background/80 p-2.5 border border-border/40 text-xs space-y-1">
                  <span className="text-muted-foreground block text-[11px]">
                    Concepto sugerido para Bizum:
                  </span>
                  <div className="flex items-center justify-between gap-2 font-mono font-medium text-foreground">
                    <span className="truncate">Gasolina {selected.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => copyBizumConcept(`Gasolina ${selected.name}`)}
                      title="Copiar concepto"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </Button>
                  </div>
                </div>

                {/* Botón Bizum con deep links bancarios / app */}
                <div className="space-y-2">
                  <a
                    href={`bizum://pay?amount=${selected.amount.toFixed(2)}&concept=Gasolina%20${encodeURIComponent(
                      selected.name
                    )}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00A896] hover:bg-[#009181] text-white py-2.5 px-4 text-xs font-bold shadow-sm transition-colors"
                  >
                    <Smartphone size={14} />
                    Hacer Bizum ({selected.amount.toFixed(2)} €)
                  </a>
                  <p className="text-[11px] text-center text-muted-foreground">
                    Abre tu app bancaria habitual para completar el envío a {driverName}.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
