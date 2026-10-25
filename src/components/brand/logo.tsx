import { cn } from "@/lib/utils"

/** Gota de combustible partida en dos: el reparto del viaje. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <defs>
        <clipPath id="plg-left">
          <rect x="0" y="0" width="11.4" height="24" />
        </clipPath>
        <clipPath id="plg-right">
          <rect x="12.6" y="0" width="11.4" height="24" />
        </clipPath>
      </defs>
      <path
        d="M12 2.2C12 2.2 4.6 10 4.6 14.9a7.4 7.4 0 0 0 14.8 0C19.4 10 12 2.2 12 2.2Z"
        className="fill-primary"
        clipPath="url(#plg-left)"
      />
      <path
        d="M12 2.2C12 2.2 4.6 10 4.6 14.9a7.4 7.4 0 0 0 14.8 0C19.4 10 12 2.2 12 2.2Z"
        className="fill-fuel"
        clipPath="url(#plg-right)"
      />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-semibold tracking-tight">
        PagaLaGasofa
      </span>
    </span>
  )
}
