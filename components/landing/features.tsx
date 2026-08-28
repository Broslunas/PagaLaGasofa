"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, Sparkles, Users, Share2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: MapPin,
    title: "Distancia automática",
    description: "Geocodifica origen y destino, calcula los km reales de la ruta.",
  },
  {
    icon: Sparkles,
    title: "Consumo con IA",
    description: "¿No sabes cuánto gasta tu coche? Lo estimamos por ti.",
  },
  {
    icon: Users,
    title: "Reparto justo",
    description: "Cada pasajero paga su parte, el conductor recupera lo suyo.",
  },
  {
    icon: Share2,
    title: "Ticket compartible",
    description: "Link público al momento, sin cuenta ni fricción.",
  },
];

export function Features() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-feature-card]", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        scrollTrigger: { trigger: scope.current, start: "top 80%" },
      });
    },
    { scope }
  );

  return (
    <section id="como-funciona" ref={scope} className="px-4 py-20 md:py-28">
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} data-feature-card>
            <CardHeader>
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={18} />
              </div>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">{description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
