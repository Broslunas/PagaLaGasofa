"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Fuel gauge that sweeps from Full to Empty and blinks the warning light — the tank's dry, and so is this route. */
function EmptyGauge() {
  return (
    <svg viewBox="0 0 200 120" width="200" height="120" className="mx-auto">
      <path d="M20,110 A80,80 0 0 1 180,110" fill="none" stroke="var(--color-border)" strokeWidth="10" strokeLinecap="round" />
      <path
        d="M20,110 A80,80 0 0 1 60,36"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.4"
      />
      <text x="30" y="100" fontSize="12" fill="var(--color-muted-foreground)">E</text>
      <text x="160" y="100" fontSize="12" fill="var(--color-muted-foreground)">F</text>
      <line
        data-needle
        x1="100"
        y1="110"
        x2="164"
        y2="87"
        stroke="var(--color-foreground)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="100" cy="110" r="5" fill="var(--color-foreground)" />
      <g data-warning style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx="100" cy="14" r="11" fill="var(--color-destructive)" opacity="0.15" />
        <foreignObject x="89" y="3" width="22" height="22">
          <TriangleAlert className="size-[22px] text-destructive" strokeWidth={2.5} />
        </foreignObject>
      </g>
    </svg>
  );
}

export default function NotFound() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-404-blob]", { opacity: 0, scale: 0.6, duration: 0.8, stagger: 0.1 })
        .from("[data-404-gauge]", { y: -16, opacity: 0, duration: 0.5 }, "-=0.4")
        .to("[data-needle]", { attr: { x2: 36, y2: 87 }, duration: 1.1, ease: "power2.inOut" }, "-=0.1")
        .from("[data-404-title]", { y: 20, opacity: 0, duration: 0.5 }, "-=0.6")
        .from("[data-404-subtitle]", { y: 14, opacity: 0, duration: 0.4 }, "-=0.3")
        .from("[data-404-cta]", { y: 12, opacity: 0, duration: 0.4 }, "-=0.2")
        .to("[data-warning]", { opacity: 0.15, duration: 0.5, repeat: -1, yoyo: true, ease: "power1.inOut" }, "-=0.3");
    },
    { scope }
  );

  return (
    <div
      ref={scope}
      className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center
        bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary),transparent_85%),transparent_60%)]"
    >
      <div data-404-blob className="absolute -left-20 top-10 size-64 rounded-full bg-primary/20 blur-3xl" />
      <div data-404-blob className="absolute -right-20 bottom-0 size-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 flex max-w-md flex-col items-center gap-2">
        <div data-404-gauge>
          <EmptyGauge />
        </div>

        <h1 data-404-title className="text-6xl font-semibold tracking-tight text-primary md:text-7xl">
          404
        </h1>
        <p data-404-subtitle className="text-lg font-medium">Te has quedado sin gasolina</p>
        <p className="max-w-sm text-balance text-muted-foreground">
          Esta página no existe o se ha quedado tirada en la cuneta. Vuelve a la carretera principal.
        </p>

        <div data-404-cta className="mt-4">
          <Button size="lg" render={<Link href="/" />} nativeButton={false}>
            <ArrowLeft />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
