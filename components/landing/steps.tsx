import { Navigation, Calculator, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    icon: Navigation,
    title: "Pon origen y destino",
    description: "Autocompletamos las ciudades y calculamos la distancia exacta por carretera automáticamente.",
  },
  {
    number: "02",
    icon: Calculator,
    title: "Añade coche y pasajeros",
    description: "Indica consumo de tu coche (o usa nuestra estimación por IA), precio de gasolina y peajes.",
  },
  {
    number: "03",
    icon: Share2,
    title: "Comparte el enlace",
    description: "Generamos un ticket público. Cada amigo entra, ve su importe y marcas los Bizums recibidos.",
  },
];

export function Steps() {
  return (
    <section id="como-funciona" className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Paso a paso
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            En menos de 30 segundos
          </h2>
          <p className="mt-2 text-muted-foreground">
            Olvídate de abrir Google Maps, la calculadora y hacer cuentas mentales en la gasolinera.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="relative overflow-hidden border-border/60 bg-card/60 transition-all hover:border-primary/40 hover:shadow-lg">
                <div className="absolute right-4 top-4 font-heading text-4xl font-black text-muted/30">
                  {step.number}
                </div>
                <CardContent className="space-y-4 p-6">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
