"use client";

import {
  Users,
  Share2,
  Fuel,
  Car,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function Features() {
  return (
    <section id="caracteristicas" className="relative px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            Diseñado para quien viaja acompañado
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Todo lo necesario para calcular costes reales sin cálculos de servilleta.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="space-y-6">
          {/* Row 1: Featured 2/3 + Reparto Justo 1/3 */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Bento 1: Large Featured Card (spans 2 on desktop) */}
            <div className="group relative rounded-3xl p-1.5 ring-1 ring-border/50 bg-muted/20 transition-all duration-300 hover:ring-primary/40 hover:shadow-xl hover:shadow-primary/5 lg:col-span-2 [grid-column:auto] lg:[grid-column:span_2/span_2]">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[calc(1.5rem-0.375rem)] border border-border/40 bg-gradient-to-br from-card via-card to-primary/5 p-7 md:p-9 shadow-sm">
                <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-primary/10 blur-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
                      <Zap className="size-6" />
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      Datos MITECO en vivo
                    </span>
                  </div>

                  <h3 className="mt-6 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    Distancia real y carburante al céntimo
                  </h3>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                    Geocodificación con cálculo de kilómetros reales de carretera. Consulta automática de precios oficiales de todas las estaciones de servicio de España para que el precio del litro sea exacto.
                  </p>
                </div>

                {/* Visual widget strip */}
                <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 rounded-2xl border border-border/50 bg-background/70 p-4 backdrop-blur-sm sm:grid-cols-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-muted-foreground">Origen y Destino</span>
                    <p className="font-semibold text-foreground text-sm">Autocompletado</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase text-muted-foreground">Precios</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">Actualizados hoy</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground">IA Predictiva</span>
                    <p className="font-semibold text-primary text-sm">Consumo de catálogo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Reparto Justo (1 col) */}
            <div className="group relative rounded-3xl p-1.5 ring-1 ring-border/50 bg-muted/20 transition-all duration-300 hover:ring-primary/40 hover:shadow-xl hover:shadow-primary/5 lg:col-span-1 [grid-column:auto] lg:[grid-column:span_1/span_1]">
              <div className="flex h-full flex-col justify-between rounded-[calc(1.5rem-0.375rem)] border border-border/40 bg-card p-7 shadow-sm">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
                    <Users className="size-6" />
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-bold tracking-tight text-foreground">
                    Reparto justo para todos
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    El conductor nunca adelanta dinero sin saber cuánto le deben. La app descuenta su porción y le indica los cobros pendientes.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-border/40 bg-muted/25 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conductor</span>
                    <span className="font-mono font-semibold text-foreground">0 € de pérdida</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                    <div className="h-full w-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Three equal 1/3 modules */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Bento 3: Ticket compartible */}
            <div className="group relative rounded-3xl p-1.5 ring-1 ring-border/50 bg-muted/20 transition-all duration-300 hover:ring-primary/40 hover:shadow-xl hover:shadow-primary/5">
              <div className="flex h-full flex-col justify-between rounded-[calc(1.5rem-0.375rem)] border border-border/40 bg-card p-7 shadow-sm">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
                    <Share2 className="size-6" />
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-bold tracking-tight text-foreground">
                    Ticket público instantáneo
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Enlace único generado al vuelo. Tus amigos ven el desglose, su importe y marcan cuando han hecho el Bizum.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/40 bg-muted/25 px-4 py-3 text-xs font-mono">
                  <span className="text-muted-foreground">pagalagasofa.com/t/...</span>
                  <span className="text-primary font-semibold">Copiar link</span>
                </div>
              </div>
            </div>

            {/* Bento 4: Garaje Virtual */}
            <div className="group relative rounded-3xl p-1.5 ring-1 ring-border/50 bg-muted/20 transition-all duration-300 hover:ring-primary/40 hover:shadow-xl hover:shadow-primary/5">
              <div className="flex h-full flex-col justify-between rounded-[calc(1.5rem-0.375rem)] border border-border/40 bg-card p-7 shadow-sm">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
                    <Car className="size-6" />
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-bold tracking-tight text-foreground">
                    Garaje virtual personal
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Inicia sesión si quieres guardar tus vehículos habituales. Tus consumos medios quedan listos para futuros viajes.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-border/40 bg-muted/25 p-3.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Fuel className="size-4 text-primary" />
                    <span className="font-medium text-foreground">Seat León 1.5 TSI · 5.8 L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 5: Privacidad sin cuenta */}
            <div className="group relative rounded-3xl p-1.5 ring-1 ring-border/50 bg-muted/20 transition-all duration-300 hover:ring-primary/40 hover:shadow-xl hover:shadow-primary/5">
              <div className="flex h-full flex-col justify-between rounded-[calc(1.5rem-0.375rem)] border border-border/40 bg-card p-7 shadow-sm">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
                    <ShieldCheck className="size-6" />
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-bold tracking-tight text-foreground">
                    Sin descarga ni cuenta obligatoria
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Sin formularios de registro obligatorios ni apps pesadas que ocupen espacio. Abre el navegador y calcula.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/40 bg-muted/25 px-4 py-3 text-xs">
                  <span className="text-muted-foreground">Registro obligatorio</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">0% Requerido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
