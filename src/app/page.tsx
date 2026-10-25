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
      <Button asChild variant="outline">
        <Link href="/design">Guía de estilo</Link>
      </Button>
    </div>
  )
}
