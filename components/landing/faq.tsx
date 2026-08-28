import { HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    q: "¿Necesito registrarme o que mis amigos tengan cuenta?",
    a: "No. Puedes calcular y generar tickets de forma totalmente anónima. Tus acompañantes solo tienen que abrir el enlace para ver el desglose.",
  },
  {
    q: "¿Cómo sabe el consumo de mi coche?",
    a: "Puedes introducir el consumo medio exacto (l/100km) o indicar la marca y modelo: nuestra IA estima el consumo homologado en autovía.",
  },
  {
    q: "¿Tiene en cuenta ida y vuelta y peajes?",
    a: "Sí. Puedes activar 'Ida y vuelta' con un click y sumar gastos extra como peajes o párking que se repartirán equitativamente.",
  },
  {
    q: "¿Qué ventajas tengo si inicio sesión?",
    a: "Si te registras con Google puedes guardar tus coches habituales en el garaje virtual para no reescribir consumos nunca más, y tener historial de viajes.",
  },
  {
    q: "¿Se puede descargar o enviar por WhatsApp?",
    a: "Sí. Con un botón copias el enlace público o descargas una imagen PNG lista para compartir en grupos de WhatsApp o Telegram.",
  },
  {
    q: "¿Es gratis?",
    a: "100% gratis y sin anuncios molestos. Hecho por y para gente que viaja en coche con colegas.",
  },
];

export function FAQ() {
  return (
    <section className="border-t border-border/40 bg-muted/10 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Dudas frecuentes
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Preguntas habituales
          </h2>
          <p className="mt-2 text-muted-foreground">
            Todo lo que necesitas saber antes de tu próximo viaje.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {faqs.map((faq, i) => (
            <Card key={i} className="border-border/60 bg-card/60">
              <CardContent className="space-y-2 p-6">
                <h3 className="flex items-start gap-2 font-heading text-base font-semibold text-foreground">
                  <HelpCircle className="mt-0.5 shrink-0 text-primary" size={18} />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground pl-6">
                  {faq.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
