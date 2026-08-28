import Link from "next/link";
import { ArrowRight, Fuel, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/15 via-card/80 to-card p-8 text-center shadow-2xl md:p-14">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-xl space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles size={13} />
            Listo para el fin de semana
          </div>

          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
            ¿Planeando escapada con amigos?
          </h2>

          <p className="text-muted-foreground md:text-base">
            Calcula el coste de tu ruta en segundos y ten el link de cobro antes de arrancar el motor.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" render={<Link href="/app" />} nativeButton={false}>
              <Fuel />
              Calcular mi viaje gratis
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
