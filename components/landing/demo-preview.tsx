import { ArrowRight, CheckCircle2, QrCode } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DemoPreview() {
  return (
    <section className="border-t border-border/40 bg-muted/20 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Ticket en tiempo real
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Así de limpio queda el reparto
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sin hojas de cálculo ni discusiones. Genera un enlace y pásalo por el grupo de WhatsApp.
          </p>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Fake ticket mockup */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-primary/10 opacity-70 blur-xl" />
            <Card className="relative border-primary/20 bg-card/90 shadow-2xl backdrop-blur-sm">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ruta</span>
                    <p className="font-heading text-lg font-semibold text-foreground">Madrid → Valencia</p>
                  </div>
                  <span className="rounded-md bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                    355 km · Ida y vuelta
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-center">
                  <div>
                    <span className="text-xs text-muted-foreground">Coste total</span>
                    <p className="text-2xl font-bold text-foreground">92,30 €</p>
                  </div>
                  <div className="border-l border-border/60">
                    <span className="text-xs text-muted-foreground">Por persona (4)</span>
                    <p className="text-2xl font-bold text-primary">23,08 €</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estado de pagos
                  </span>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-2">
                      <span className="font-medium">Pablo (Conductor)</span>
                      <span className="text-xs text-muted-foreground">Recibe 69,24 €</span>
                    </li>
                    <li className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-2">
                      <span>Sara</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500">
                        <CheckCircle2 size={13} /> Pagado (23,08 €)
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-2">
                      <span>Marcos</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500">
                        <CheckCircle2 size={13} /> Pagado (23,08 €)
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-2">
                      <span>Lucía</span>
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                        Pendiente (23,08 €)
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Explanation points */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                1
              </div>
              <div>
                <h3 className="font-heading text-lg font-medium text-foreground">El conductor nunca pierde pasta</h3>
                <p className="text-sm text-muted-foreground">
                  El cálculo descuenta tu parte y te dice exactamente cuánto tienes que ingresar de los demás.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                2
              </div>
              <div>
                <h3 className="font-heading text-lg font-medium text-foreground">Marca quién ha pagado con un toque</h3>
                <p className="text-sm text-muted-foreground">
                  El ticket web se actualiza en vivo. Tus amigos ven quién falta por hacer el Bizum.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <QrCode size={18} />
              </div>
              <div>
                <h3 className="font-heading text-lg font-medium text-foreground">Comparte como link o imagen PNG</h3>
                <p className="text-sm text-muted-foreground">
                  Genera una preview bonita lista para pegar en cualquier chat de grupo.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button size="lg" render={<Link href="/viaje" />} nativeButton={false}>
                Probar el calculador
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
