import Link from "next/link"

import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { es } from "@/i18n/es"

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <LogoMark className="size-16" />
      <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
        {es.app.tagline}
      </h1>
      <p className="text-pretty text-muted-foreground">{es.soon}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/viaje">Calcular un viaje</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/gasolineras">Gasolineras</Link>
        </Button>
      </div>
      <Link href="/design" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
        Guía de estilo
      </Link>
    </div>
  )
}
