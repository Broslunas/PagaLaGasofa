import type { Metadata } from "next"
import Link from "next/link"

import { LegsFragment, PaidFragment, StationsFragment, TicketFragment } from "@/components/landing/fragments"
import { LiveCalculator } from "@/components/landing/live-calculator"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: { absolute: "PagaLaGasofa · Reparte el coste del viaje, sin discusiones" },
  description:
    "Calcula lo que cuesta el viaje en coche, repártelo entre quienes van y manda un enlace para cobrar. Con precios de gasolineras de toda España. Gratis y sin cuenta.",
  alternates: { canonical: "/" },
}

const STEPS = [
  { title: "Di de dónde a dónde sales.", text: "Busca el origen y el destino, o toca el mapa. Añade paradas si recoges a alguien por el camino." },
  { title: "Apunta quién va y en qué coche.", text: "Elige tu coche de un catálogo con consumos oficiales, o escribe el tuyo. Gasolina, diésel o eléctrico." },
  { title: "Manda el enlace y cobra.", text: "Cada uno ve lo que le toca. Tú marcas quién ha pagado y todos lo ven al momento." },
] as const

const FAQ = [
  ["¿Necesito una cuenta?", "No. Calculas y compartes un ticket sin registrarte. Con cuenta (Google o un enlace por correo) guardas tus vehículos, viajes y favoritas, y ves cuánto te deben en total."],
  ["¿Cuánto cuesta?", "Nada. No hay publicidad ni planes de pago."],
  ["¿De dónde salen los precios y los consumos?", "Los precios y horarios de las gasolineras son datos oficiales del Ministerio para la Transición Ecológica, y los consumos de los coches vienen del registro europeo de turismos nuevos (valores WLTP). Son orientativos: tu consumo real puede variar y puedes ajustarlo."],
  ["¿PagaLaGasofa cobra el dinero?", "No. Calcula y reparte; cada uno paga como quiera (Bizum, efectivo…). Tú marcas quién ha pagado."],
  ["¿Qué pasa con mi ubicación?", "Solo la usamos si pulsas «usar mi ubicación» o compartes tu posición en directo. En directo se guarda únicamente la última posición y se borra al parar."],
  ["¿Puedo usarla en el móvil como una app?", "Sí. Ábrela en el navegador y añádela a la pantalla de inicio: se abre a pantalla completa y puede enviarte avisos de precio."],
] as const

export default async function Home() {
  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  })

  return (
    <>
      {/* Primera pantalla: qué es, a quién le sirve y el botón. */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:pt-16 sm:pb-24">
          <h1 className="rise font-heading text-[clamp(2.25rem,8.6vw,7.25rem)] leading-[0.96] font-semibold tracking-[-0.04em]">
            <span className="block">Reparte la gasofa.</span>
            <span className="block">Sin discusiones.</span>
          </h1>
          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:gap-16">
            <div>
              <p className="rise max-w-xl text-xl leading-relaxed text-foreground/85 sm:text-2xl" style={{ "--d": "90ms" } as React.CSSProperties}>
                Calcula lo que cuesta el viaje, divídelo entre quienes van y mándales un enlace para que paguen. Sin cuenta y sin descargar nada.
              </p>
              <div className="rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--d": "180ms" } as React.CSSProperties}>
                <Button asChild size="lg" className="h-14 rounded-full px-8 text-lg">
                  <Link href="/viaje">Calcular un viaje</Link>
                </Button>
                <Link href="/gasolineras" className="text-lg font-medium underline underline-offset-4">Ver precios de gasolineras</Link>
              </div>
            </div>
            <div className="rise rounded-[2rem] bg-primary p-4 sm:p-8" style={{ "--d": "260ms" } as React.CSSProperties}>
              <TicketFragment />
            </div>
          </div>
        </div>
      </section>

      {/* Lo interactivo: el reparto de verdad con los números del visitante. */}
      <section className="bg-primary-soft">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-28">
          <h2 className="max-w-3xl text-balance font-heading text-[clamp(2rem,6vw,4.25rem)] leading-[1.02] font-semibold tracking-[-0.03em]">Pon tus números.</h2>
          <p className="mt-4 mb-12 max-w-2xl text-xl text-foreground/85">
            Es el mismo cálculo de la app: litros, precio y personas. Mueve los controles y mira cuánto toca a cada uno.
          </p>
          <LiveCalculator />
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:py-32 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="text-balance font-heading text-[clamp(2rem,6vw,4.25rem)] leading-[1.02] font-semibold tracking-[-0.03em]">Un viaje, tres pasos.</h2>
          <ol className="space-y-12">
            {STEPS.map((s) => (
              <li key={s.title}>
                <p className="font-heading text-[clamp(1.5rem,3.4vw,2.5rem)] leading-tight font-semibold tracking-tight">{s.title}</p>
                <p className="mt-2 max-w-xl text-lg text-foreground/80">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto w-full max-w-6xl space-y-24 px-4 py-24 sm:space-y-36 sm:py-32">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="text-balance font-heading text-[clamp(1.875rem,5vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.03em]">Cada uno paga lo que viaja.</h2>
              <p className="mt-5 max-w-lg text-lg text-foreground/85">
                Si alguien se sube a mitad de camino, solo paga desde donde va en el coche. También puedes repartir a partes iguales, por porcentajes o con importes a mano, y dejar al conductor invitado.
              </p>
            </div>
            <LegsFragment />
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <StationsFragment className="lg:order-first" />
            <div>
              <h2 className="text-balance font-heading text-[clamp(1.875rem,5vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.03em]">La gasolina más barata, en tu ruta.</h2>
              <p className="mt-5 max-w-lg text-lg text-foreground/85">
                Antes de salir ves las gasolineras a menos de 3 km de tu ruta con el precio de hoy, y con un toque usas ese precio en el cálculo. Más de 11.000 gasolineras de toda España, actualizadas cada hora.
              </p>
              <Link href="/gasolineras" className="mt-6 inline-block text-lg font-medium underline underline-offset-4">Buscar gasolineras</Link>
            </div>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="text-balance font-heading text-[clamp(1.875rem,5vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.03em]">Un ticket que se cobra solo.</h2>
              <p className="mt-5 max-w-lg text-lg text-foreground/85">
                Un enlace, un PDF, una imagen para WhatsApp y un código QR. Tú marcas los pagos y quienes miran el ticket los ven cambiar al momento.
              </p>
            </div>
            <PaidFragment />
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-24 sm:py-32 md:grid-cols-2 md:gap-20">
          <div>
            <h2 className="text-balance font-heading text-[clamp(1.75rem,4.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">Te avisa cuando baja.</h2>
            <p className="mt-4 max-w-md text-lg text-foreground/85">
              Guarda tus gasolineras favoritas y recibe una notificación o un correo cuando baje el precio, o cuando llegue al que tú quieras.
            </p>
          </div>
          <div>
            <h2 className="text-balance font-heading text-[clamp(1.75rem,4.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">Que te sigan en directo.</h2>
            <p className="mt-4 max-w-md text-lg text-foreground/85">
              Comparte tu ubicación con un enlace mientras conduces. Solo se guarda tu posición actual y se borra al terminar.
            </p>
            <Link href="/en-vivo" className="mt-6 inline-block text-lg font-medium underline underline-offset-4">Compartir mi ubicación</Link>
          </div>
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:py-32 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="text-balance font-heading text-[clamp(2rem,6vw,4.25rem)] leading-[1.02] font-semibold tracking-[-0.03em]">Preguntas.</h2>
          <div className="space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-background p-5 open:pb-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-2xl leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-lg text-foreground/85">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:py-32">
          <h2 className="max-w-4xl text-balance font-heading text-[clamp(2.25rem,7.5vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.035em]">
            Tu próximo viaje, repartido en un minuto.
          </h2>
          <Button asChild size="lg" variant="secondary" className="mt-10 h-14 rounded-full px-8 text-lg">
            <Link href="/viaje">Calcular un viaje</Link>
          </Button>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
    </>
  )
}
