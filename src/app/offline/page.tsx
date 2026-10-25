import type { Metadata } from "next"
import Link from "next/link"

import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Sin conexión", robots: { index: false } }

/** Página que el service worker muestra cuando no hay red. Estática y sin datos personales. */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <LogoMark className="size-14" />
      <h1 className="text-balance text-3xl font-semibold">Sin conexión</h1>
      <p className="text-muted-foreground">
        Ahora mismo no hay internet. Los precios, las rutas y los tickets necesitan conexión: vuelve a intentarlo cuando la recuperes.
      </p>
      <Button asChild size="lg">
        <Link href="/app" prefetch={false}>Reintentar</Link>
      </Button>
    </div>
  )
}
