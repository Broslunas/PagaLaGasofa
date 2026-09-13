"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "¿Necesito registrarme o que mis amigos tengan cuenta?",
    a: "No. Puedes calcular y generar tickets de forma totalmente anónima. Tus acompañantes solo tienen que abrir el enlace para ver el desglose exacto sin instalar nada.",
  },
  {
    q: "¿Cómo calcula el consumo de mi coche?",
    a: "Puedes introducir el consumo medio exacto (L/100km) o indicar la marca y modelo: nuestra IA estima el consumo homologado en autovía según ficha técnica.",
  },
  {
    q: "¿Tiene en cuenta ida y vuelta y peajes?",
    a: "Sí. Puedes activar 'Ida y vuelta' con un toque y sumar gastos extra como peajes o párking, que se repartirán equitativamente entre los pasajeros.",
  },
  {
    q: "¿Qué ventajas tengo si inicio sesión?",
    a: "Si te registras con Google puedes guardar tus coches en el garaje virtual para no reescribir consumos nunca más, además de consultar tu histórico de viajes.",
  },
  {
    q: "¿Se puede descargar o enviar por WhatsApp?",
    a: "Sí. Con un botón copias el enlace público o descargas una tarjeta gráfica en formato imagen lista para compartir en grupos de chat.",
  },
  {
    q: "¿Es un servicio gratuito?",
    a: "100% gratuito y sin publicidad intrusiva. Hecho por y para personas que comparten trayectos y viajes en carretera.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((curr) => (curr === idx ? null : idx));
  };

  return (
    <section className="relative border-t border-border/40 bg-muted/10 px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left Column: Sticky Title & Context */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Preguntas habituales
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Todo lo que necesitas saber antes de subir al coche y repartir gastos con tu grupo.
            </p>
            <div className="mt-6 hidden lg:block">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-4 text-xs text-muted-foreground shadow-xs">
                <HelpCircle className="size-4 text-primary shrink-0" />
                <span>¿Dudas durante el viaje? Genera un ticket de prueba en 10 segundos.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Accordion Items */}
          <div className="space-y-3 lg:col-span-8">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-border/60 bg-card/80 transition-all duration-200 hover:border-primary/40 shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-heading text-base sm:text-lg font-semibold text-foreground">
                      {faq.q}
                    </span>
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-transform duration-300 ${
                        isOpen ? "rotate-180 bg-primary/10 text-primary" : ""
                      }`}
                    >
                      <ChevronDown className="size-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/40 px-5 pb-5 pt-3 sm:px-6 sm:pb-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
