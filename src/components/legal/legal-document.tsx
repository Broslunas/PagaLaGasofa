import Link from "next/link"
import type { ReactNode } from "react"

import { LEGAL_UPDATED } from "@/lib/legal"

const PAGES = [
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/terminos", label: "Términos de uso" },
] as const

/** Estructura común de las páginas legales: HTML semántico con estilos por descendiente. */
export function LegalDocument({ title, current, children }: { title: string; current: (typeof PAGES)[number]["href"]; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:py-14">
      <nav aria-label="Textos legales" className="mb-6 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={p.href === current ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm ${p.href === current ? "bg-primary-soft font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <header className="mb-8 space-y-1 pb-2">
        <h1 className="text-balance text-3xl font-semibold md:text-4xl">{title}</h1>
        <p className="text-sm text-muted-foreground">Última actualización: {LEGAL_UPDATED}</p>
      </header>
      <div
        className="space-y-4 text-base leading-relaxed
          [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold
          [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold
          [&_p]:text-foreground/85
          [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-foreground/85
          [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:font-semibold [&_strong]:text-foreground
          [&_table]:w-full [&_table]:text-left [&_table]:text-sm
          [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold
          [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_tr:nth-child(even)_td]:bg-muted/40"
      >
        {children}
      </div>
    </div>
  )
}
