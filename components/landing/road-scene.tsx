"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Car } from "lucide-react";

/** Decorative looping "car driving down the road" scene for the hero. */
export function RoadScene() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(scope.current, {
        x: -50,
        opacity: 0,
        duration: 0.9,
        delay: 0.9,
        ease: "power2.out",
      });
    },
    { scope }
  );

  return (
    <div ref={scope} className="relative mx-auto mt-4 h-20 w-full max-w-sm md:h-24">
      {/* road surface + dashed center line */}
      <div className="absolute inset-x-0 bottom-0 h-5 rounded-b-xl bg-muted" />
      <div
        className="absolute inset-x-0 bottom-[16px] h-[3px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--color-border) 0 20px, transparent 20px 36px)",
          animation: "road-dash-move 0.6s linear infinite",
        }}
      />

      {/* car */}
      <div
        className="absolute bottom-[19px] left-1/2 -translate-x-1/2"
        style={{ animation: "car-bounce 0.5s ease-in-out infinite" }}
      >
        <span
          className="absolute -left-2 bottom-2 size-1.5 rounded-full bg-muted-foreground/50"
          style={{ animation: "exhaust-puff 0.9s ease-out infinite" }}
        />
        <span
          className="absolute -left-2 bottom-2 size-1.5 rounded-full bg-muted-foreground/50"
          style={{ animation: "exhaust-puff 0.9s ease-out 0.45s infinite" }}
        />
        <Car className="size-10 text-primary md:size-12" strokeWidth={1.75} />
      </div>
    </div>
  );
}
