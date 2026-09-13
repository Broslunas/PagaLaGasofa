import { MapPin, Gauge, Share2, Check, ArrowRight } from "lucide-react";

const MILESTONES = [
  {
    action: "Define la ruta",
    detail: "Geocodificación instantánea. Detectamos el kilometraje real de carretera sin que abras Maps.",
    icon: MapPin,
    preview: {
      badge: "Madrid → Valencia",
      metric: "355 km",
      sub: "Cálculo vial directo",
    },
  },
  {
    action: "Ajusta consumo y personas",
    detail: "Introduce tu consumo medio o déjalo en manos de nuestra IA. Añade peajes con un clic.",
    icon: Gauge,
    preview: {
      badge: "4 ocupantes",
      metric: "6,2 L / 100km",
      sub: "Gasolina 95 oficial",
    },
  },
  {
    action: "Envía el ticket al grupo",
    detail: "Genera un enlace web público. Cada amigo entra, ve su importe y marcas los Bizums recibidos.",
    icon: Share2,
    preview: {
      badge: "Ticket listo",
      metric: "23,08 € / persona",
      sub: "Sin crear cuenta",
    },
  },
];

export function Steps() {
  return (
    <section id="como-funciona" className="relative px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section Header: stacked vertically, no split header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            De la idea al Bizum en segundos
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Sin hojas de cálculo ni peleas por quién pagó el último depósito.
          </p>
        </div>

        {/* Milestone Route Architecture */}
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Subtle connecting road line in desktop */}
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-[2px] -translate-y-12 bg-border/70 md:block" />

          {MILESTONES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.action}
                className="group relative flex flex-col justify-between rounded-3xl p-1.5 ring-1 ring-border/50 bg-muted/20 transition-all duration-300 hover:ring-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-full flex-col justify-between rounded-[calc(1.5rem-0.375rem)] border border-border/40 bg-card p-6 shadow-sm">
                  <div>
                    {/* Icon + Micro badge */}
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="size-5" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">
                        <Check className="size-3 text-emerald-500" />
                        {item.preview.badge}
                      </span>
                    </div>

                    {/* Action Title & Detail */}
                    <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                      {item.action}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>

                  {/* Micro Visual Card inside core */}
                  <div className="mt-6 rounded-2xl border border-border/40 bg-muted/20 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{item.preview.metric}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{item.preview.sub}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
