import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative px-4 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Double-Bezel Hardware Frame */}
        <div className="rounded-[2.5rem] p-2 ring-1 ring-primary/25 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent shadow-2xl shadow-primary/10">
          <div className="relative overflow-hidden rounded-[calc(2.5rem-0.5rem)] border border-border/60 bg-card/90 px-6 py-14 text-center backdrop-blur-md sm:px-12 md:py-20">
            {/* Subtle background glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.18em] text-primary">
                <Sparkles className="size-3.5" />
                Listo para la carretera
              </div>

              <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-foreground text-balance">
                ¿Planeando escapada con amigos?
              </h2>

              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                Calcula el coste de tu ruta en segundos y ten el link de cobro antes de arrancar el motor.
              </p>

              {/* Button-in-Button CTA */}
              <div className="flex justify-center pt-2">
                <Link
                  href="/viaje"
                  className="group inline-flex items-center gap-3.5 rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-300 hover:bg-primary/95 hover:shadow-primary/45 active:scale-[0.98]"
                >
                  <span>Calcular mi viaje</span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-black/15 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5 dark:bg-white/20">
                    <ArrowUpRight className="size-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
