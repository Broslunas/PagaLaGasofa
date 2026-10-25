import Link from "next/link"
import { Suspense } from "react"

import { Logo } from "@/components/brand/logo"
import { AuthButton } from "@/components/layout/auth-button"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <Link href="/" aria-label="PagaLaGasofa">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="mr-auto ml-6 hidden items-center gap-1 md:flex">
          <Link href="/viaje" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">Calcular viaje</Link>
          <Link href="/gasolineras" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">Gasolineras</Link>
          <Link href="/en-vivo" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">En directo</Link>
        </nav>
        <div className="flex items-center gap-1">
          <Suspense fallback={<div className="h-8 w-20" aria-hidden />}>
            <AuthButton />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
