import { cn } from "@/lib/utils"

const HUES = [160, 200, 25, 340, 265, 95, 45, 300, 180, 10]

function hash(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

/** Círculo con las iniciales de la marca, de un color estable por marca (sin logos de terceros). */
export function BrandAvatar({ brand, name, className }: { brand: string; name: string; className?: string }) {
  const label = (brand || name).replace(/[^A-Za-zÁÉÍÓÚÑ0-9 ]/g, "").trim()
  const words = label.split(/\s+/)
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : label.slice(0, 2)).toUpperCase()
  const hue = HUES[hash(brand || name) % HUES.length]
  return (
    <span
      aria-hidden
      style={{ "--h": hue } as React.CSSProperties}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-[oklch(0.92_0.06_var(--h))] text-sm font-bold text-[oklch(0.35_0.09_var(--h))] dark:bg-[oklch(0.3_0.06_var(--h))] dark:text-[oklch(0.85_0.09_var(--h))]",
        className,
      )}
    >
      {initials}
    </span>
  )
}
