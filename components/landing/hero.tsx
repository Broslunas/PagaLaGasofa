"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Compass, ShieldCheck, Zap } from "lucide-react";
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
        )
        .from("[data-hero-badges] > *", { opacity: 0, y: 10, duration: 0.4, stagger: 0.06 }, "-=0.2")
        .from("[data-hero-stage]", { opacity: 0, y: 30, duration: 0.7 }, "-=0.3");
    },
    { scope }
  );

  return (
    <section
      ref={scope}
      className="relative flex min-h-[92dvh] flex-col items-center justify-between overflow-hidden px-4 pt-12 pb-16 md:pt-16 md:pb-24
        bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary),transparent_88%),transparent_65%)]"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-28 top-8 size-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-20 size-96 rounded-full bg-primary/10 blur-3xl" />

      {/* Hero content stack */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        {/* Eyebrow badge */}
        <div
          data-hero-eyebrow
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-mono uppercase tracking-[0.18em] text-primary"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Sin registro ni fricción
        </div>

        {/* Display headline */}
        <h1
          data-hero-title
          className="font-heading text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-foreground text-balance"
        >
          Reparte la gasofa, no la amistad
        </h1>

        {/* Subtitle: under 20 words, no em-dash */}
        <p
          data-hero-subtitle
          className="max-w-xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          Calcula distancia, consumo y reparte el gasto en segundos con ticket público listo para WhatsApp.
        </p>

        {/* Island buttons with Button-in-Button pattern */}
        <div data-hero-cta className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
          <Link
            href="/viaje"
            className="group relative inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 ease-out hover:bg-primary/95 hover:shadow-primary/40 active:scale-[0.98]"
          >
            <span>Calcular mi viaje</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-black/15 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5 dark:bg-white/20">
              <ArrowUpRight className="size-4" />
            </span>
          </Link>

          <Link
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-5 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors duration-200 hover:bg-muted/60 active:scale-[0.98]"
          >
            <Compass className="size-4 text-muted-foreground" />
            <span>Cómo funciona</span>
          </Link>
        </div>

        {/* Trust chips: micro metrics */}
        <div
          data-hero-badges
          className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1">
            <Zap className="size-3 text-primary" />
            <span>Estimación con IA</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1">
            <ShieldCheck className="size-3 text-emerald-500" />
            <span>Precios oficiales MITECO</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1">
            <span className="font-mono text-foreground font-semibold">100%</span>
            <span>Gratis y sin app</span>
          </div>
        </div>
      </div>

      {/* Double-Bezel Road Scene stage */}
      <div
        data-hero-stage
        className="relative z-10 mx-auto mt-10 w-full max-w-5xl px-2"
      >
        <div className="rounded-3xl p-1.5 ring-1 ring-border/60 bg-muted/25 shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="relative overflow-hidden rounded-[calc(1.5rem-0.375rem)] border border-border/50 bg-card/85 p-4 backdrop-blur-md">
            <RoadScene />
          </div>
        </div>
      </div>
    </section>
  );
}
