import type { Metadata } from "next"

import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Guía de estilo", robots: { index: false } }

const swatches = [
  ["Fondo", "bg-background"],
  ["Tarjeta", "bg-card"],
  ["Primario", "bg-primary"],
  ["Primario suave", "bg-primary-soft"],
  ["Combustible", "bg-fuel"],
  ["Apagado", "bg-muted"],
  ["Éxito", "bg-success"],
  ["Aviso", "bg-warning"],
  ["Error", "bg-destructive"],
] as const

export default function DesignPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-4 py-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Guía de estilo</h1>
        <p className="text-muted-foreground">
          Propuesta de identidad de la v2. Alterna el tema desde la cabecera.
        </p>
        <Logo className="[&_svg]:size-12 [&_span]:text-3xl" />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Paleta</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {swatches.map(([name, cls]) => (
            <li key={name} className="overflow-hidden rounded-xl border bg-card">
              <div className={`h-16 ${cls}`} />
              <p className="px-3 py-2 text-sm">{name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Botones</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Eliminar</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Tipografía</h2>
        <p className="font-heading text-5xl font-semibold tracking-tight">
          Reparte la gasofa
        </p>
        <p className="text-lg">
          Cuerpo en Geist: 1 234,56 € · 87,4 km · 6,2 l/100 km
        </p>
        <p className="font-mono text-sm text-muted-foreground">Geist Mono · 0123456789</p>
      </section>
    </div>
  )
}
