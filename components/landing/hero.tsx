"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoadScene } from "@/components/landing/road-scene";

export function Hero() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero-eyebrow]", { y: 16, opacity: 0, duration: 0.5 })
        .from("[data-hero-title]", { y: 24, opacity: 0, duration: 0.6 }, "-=0.3")
        .from("[data-hero-subtitle]", { y: 16, opacity: 0, duration: 0.5 }, "-=0.35")
        .from(
          "[data-hero-cta] > *",
          { y: 12, opacity: 0, duration: 0.4, stagger: 0.08, clearProps: "opacity,transform" },
          "-=0.25"
        );
    },
    { scope }
  );

  return (
    <section
      ref={scope}
      className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center md:py-32
        bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary),transparent_85%),transparent_60%)]"
    >
      <div className="absolute -left-20 top-10 size-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6">
        <span
          data-hero-eyebrow
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          <Fuel size={14} />
          Sin registro necesario
        </span>

        <h1 data-hero-title className="text-4xl font-semibold tracking-tight md:text-6xl">
          Reparte la gasofa, no la amistad
        </h1>

        <p data-hero-subtitle className="max-w-lg text-balance text-muted-foreground md:text-lg">
          Calcula distancia, consumo y reparte el gasto entre todos en segundos.
          Genera un ticket y compártelo — nadie necesita cuenta.
        </p>

        <div data-hero-cta className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/app" />} nativeButton={false}>
            Calcular ahora
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="#como-funciona" />} nativeButton={false}>
            Cómo funciona
          </Button>
        </div>
      </div>

      <div className="relative z-10 w-full px-4">
        <RoadScene />
      </div>
    </section>
  );
}
