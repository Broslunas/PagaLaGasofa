"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Circle, QrCode, Sparkles, ReceiptText } from "lucide-react";

interface PassengerState {
  name: string;
  role?: string;
  amount: number;
  paid: boolean;
}

const INITIAL_PASSENGERS: PassengerState[] = [
  { name: "Pablo", role: "Conductor", amount: 23.08, paid: true },
  { name: "Sara", amount: 23.08, paid: true },
  { name: "Marcos", amount: 23.08, paid: true },
  { name: "Lucía", amount: 23.08, paid: false },
];

export function DemoPreview() {
  const [passengers, setPassengers] = useState<PassengerState[]>(INITIAL_PASSENGERS);

  const togglePaid = (index: number) => {
    // Don't toggle conductor
    if (index === 0) return;
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, paid: !p.paid } : p))
    );
  };

  const paidCount = passengers.filter((p, i) => i > 0 && p.paid).length;
  const pendingCount = passengers.filter((p, i) => i > 0 && !p.paid).length;
  const totalAmount = 92.30;
  const collectedAmount = passengers
    .filter((p, i) => i > 0 && p.paid)
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <section className="relative border-y border-border/40 bg-muted/15 px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-mono uppercase tracking-[0.18em] text-primary">
            <ReceiptText className="size-3.5" />
            Ticket interactivo en vivo
          </div>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            El cobro que todo el grupo entiende
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Haz clic en los acompañantes para simular el cobro de los Bizums en tiempo real.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Interactive Ticket: Double-Bezel Enclosure */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto w-full max-w-md rounded-3xl p-1.5 ring-1 ring-border/60 bg-muted/30 shadow-2xl shadow-black/5 dark:shadow-black/20">
              <div className="relative overflow-hidden rounded-[calc(1.5rem-0.375rem)] border border-border/50 bg-card p-6 shadow-sm">
                {/* Ticket Top Strip */}
                <div className="flex items-center justify-between border-b border-border/60 pb-5">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      Trayecto vial
                    </span>
                    <p className="font-heading text-xl font-bold text-foreground">
                      Madrid → Valencia
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-xs font-mono font-semibold text-primary">
                      355 km · Ida y vuelta
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="my-5 grid grid-cols-2 gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 text-center">
                  <div>
                    <span className="text-xs text-muted-foreground">Gasto total</span>
                    <p className="font-heading text-2xl font-bold text-foreground">
                      {totalAmount.toFixed(2).replace(".", ",")} €
                    </p>
                  </div>
                  <div className="border-l border-border/60">
                    <span className="text-xs text-muted-foreground">Por persona (4)</span>
                    <p className="font-heading text-2xl font-bold text-primary">
                      23,08 €
                    </p>
                  </div>
                </div>

                {/* Interactive Passenger Payment List */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      Pagos ({paidCount}/3 Bizums recibidos)
                    </span>
                    <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {collectedAmount.toFixed(2).replace(".", ",")} € cobrados
                    </span>
                  </div>

                  <div className="space-y-2">
                    {passengers.map((p, idx) => {
                      const isConductor = idx === 0;
                      return (
                        <button
                          type="button"
                          key={p.name}
                          onClick={() => togglePaid(idx)}
                          disabled={isConductor}
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                            isConductor
                              ? "cursor-default border-border/40 bg-muted/20"
                              : "cursor-pointer border-border/60 hover:border-primary/50 hover:bg-muted/30 active:scale-[0.99]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isConductor ? (
                              <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                                C
                              </div>
                            ) : p.paid ? (
                              <CheckCircle2 className="size-5 text-emerald-500" />
                            ) : (
                              <Circle className="size-5 text-amber-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {p.name} {isConductor && <span className="text-xs text-muted-foreground">(Conductor)</span>}
                              </p>
                              <span className="text-[11px] text-muted-foreground">
                                {isConductor ? "Recibe 69,24 €" : p.paid ? "Bizum marcado" : "Toca para marcar pagado"}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs font-mono font-semibold ${
                                isConductor
                                  ? "text-muted-foreground"
                                  : p.paid
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {p.paid ? "Pagado" : "Pendiente"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Footer Status */}
                <div className="mt-5 flex items-center justify-between border-t border-dashed border-border/80 pt-4 text-xs text-muted-foreground">
                  <span>Enlace público sincronizado</span>
                  <span className="font-mono">
                    {pendingCount === 0 ? "¡Todo cobrado!" : `Falta ${pendingCount} pago`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Value Props & CTA */}
          <div className="space-y-8 lg:col-span-6">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    El conductor nunca pierde dinero
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    El cálculo descuenta automáticamente tu cuota y muestra el total exacto que debe entrar a tu cuenta bancaria.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    Control de pagos transparente
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Cualquiera con el enlace ve el estado actualizado en vivo. Todos saben quién ha enviado ya su parte.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    Listo para compartir en WhatsApp
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Copia el enlace directo o descarga la tarjeta gráfica de desglose con un solo toque desde el móvil.
                  </p>
                </div>
              </div>
            </div>

            {/* Button-in-Button CTA */}
            <div className="pt-2">
              <Link
                href="/viaje"
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/95 hover:shadow-primary/40 active:scale-[0.98]"
              >
                <span>Generar mi ticket ahora</span>
                <span className="flex size-7 items-center justify-center rounded-full bg-black/15 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5 dark:bg-white/20">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
