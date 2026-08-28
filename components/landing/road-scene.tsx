"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flag } from "lucide-react";

const STOPS = [
  { id: 1, left: "26%" },
  { id: 2, left: "58%" },
];
const DESTINATION_LEFT = "92%";
const START_LEFT = "3%";

function Npc({ id }: { id: number }) {
  return (
    <svg data-npc={id} viewBox="0 0 20 30" width="18" height="27">
      <circle cx="10" cy="6" r="5" fill="var(--color-foreground)" />
      <rect x="4" y="13" width="12" height="16" rx="6" fill="var(--color-foreground)" />
    </svg>
  );
}

/** Decorative looping route: the car drives full-width, picking up waiting friends and dropping them at the destination. */
export function RoadScene() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(scope.current, {
        y: 16,
        opacity: 0,
        duration: 0.7,
        delay: 0.9,
        ease: "power2.out",
      });

      const drive = gsap.timeline({ repeat: -1, repeatDelay: 0.8, delay: 1.5, defaults: { ease: "power1.inOut" } });
      drive
        .set("[data-car]", { left: START_LEFT, opacity: 1 })
        .set("[data-npc]", { opacity: 1, scale: 1 })
        .set("[data-flag]", { scale: 1 })
        .to("[data-car]", { left: STOPS[0].left, duration: 1.5 })
        .to("[data-npc='1']", { opacity: 0, scale: 0.3, duration: 0.3 }, "-=0.1")
        .to("[data-car]", { left: STOPS[1].left, duration: 1.4 }, "+=0.3")
        .to("[data-npc='2']", { opacity: 0, scale: 0.3, duration: 0.3 }, "-=0.1")
        .to("[data-car]", { left: DESTINATION_LEFT, duration: 1.3 }, "+=0.3")
        .to("[data-flag]", { scale: 1.35, duration: 0.2, yoyo: true, repeat: 3 }, "-=0.2")
        .to("[data-car]", { opacity: 0, duration: 0.4 }, "+=0.6");
    },
    { scope }
  );

  return (
    <div ref={scope} className="relative mx-auto mt-6 h-36 w-full max-w-5xl">
      {/* road surface + dashed line, full width */}
      <div className="absolute inset-x-0 bottom-0 h-5 rounded-xl bg-muted" />
      <div
        className="absolute inset-x-0 bottom-[16px] h-[3px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--color-border) 0 20px, transparent 20px 36px)",
          animation: "road-dash-move 0.6s linear infinite",
        }}
      />

      {/* pickup stops */}
      {STOPS.map((stop) => (
        <div key={stop.id} className="absolute bottom-[16px] flex -translate-x-1/2 flex-col items-center gap-1" style={{ left: stop.left }}>
          <Npc id={stop.id} />
          <span className="map-pin-pulse absolute bottom-0 size-2 rounded-full bg-primary" />
          <span className="absolute bottom-0 size-2 rounded-full bg-primary" />
        </div>
      ))}

      {/* destination */}
      <div className="absolute bottom-[16px] flex -translate-x-1/2 flex-col items-center" style={{ left: DESTINATION_LEFT }}>
        <div data-flag>
          <Flag className="mb-1 size-5 text-primary" fill="var(--color-primary)" fillOpacity={0.25} />
        </div>
        <span className="size-2 rounded-full bg-primary" />
      </div>

      {/* car */}
      <div
        data-car
        className="absolute bottom-[16px]"
        style={{ left: START_LEFT, animation: "car-bounce 0.5s ease-in-out infinite" }}
      >
        <div className="relative -translate-x-1/2">
          <div className="absolute -bottom-[3px] left-1/2 h-2 w-10 -translate-x-1/2 rounded-full bg-black/40 blur-[3px]" />
          <span
            className="absolute left-1 bottom-7 size-1.5 rounded-full bg-muted-foreground/50"
            style={{ animation: "exhaust-puff 0.9s ease-out infinite" }}
          />
          <span
            className="absolute left-1 bottom-7 size-1.5 rounded-full bg-muted-foreground/50"
            style={{ animation: "exhaust-puff 0.9s ease-out 0.45s infinite" }}
          />

          <svg viewBox="0 0 220 110" width="150" height="75">
            {/* body + roof */}
            <rect x="18" y="58" width="184" height="32" rx="15" fill="var(--color-primary)" />
            <path d="M64,60 Q67,26 98,22 L140,22 Q168,26 172,60 Z" fill="var(--color-primary)" />

            {/* windows, split by a B-pillar */}
            <path d="M74,56 Q77,34 98,30 L112,30 L112,56 Z" fill="var(--color-background)" opacity="0.88" />
            <path d="M118,30 L140,30 Q158,34 161,56 L118,56 Z" fill="var(--color-background)" opacity="0.88" />

            {/* lights */}
            <rect x="192" y="66" width="10" height="7" rx="3" fill="#f59e0b" />
            <rect x="18" y="67" width="8" height="6" rx="3" fill="#ef4444" />

            {/* door seam + body crease */}
            <line x1="115" y1="60" x2="115" y2="86" stroke="#00000025" strokeWidth="2" />
            <line x1="32" y1="72" x2="188" y2="72" stroke="#ffffff20" strokeWidth="2" />

            {/* wheels: fixed dark tire / light hub so they read correctly in both themes */}
            {[58, 162].map((cx) => (
              <g key={cx} style={{ transformBox: "fill-box", transformOrigin: "center", animation: "wheel-spin 0.6s linear infinite" }}>
                <circle cx={cx} cy="86" r="18" fill="oklch(0.2 0 0)" />
                <circle cx={cx} cy="86" r="7" fill="oklch(0.75 0 0)" />
                <line x1={cx} y1="72" x2={cx} y2="100" stroke="oklch(0.75 0 0)" strokeWidth="2.5" />
                <line x1={cx - 14} y1="86" x2={cx + 14} y2="86" stroke="oklch(0.75 0 0)" strokeWidth="2.5" />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
