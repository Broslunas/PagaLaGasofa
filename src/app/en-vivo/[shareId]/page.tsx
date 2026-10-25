import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { LiveSharer } from "@/components/live/live-sharer"
import { LiveViewer } from "@/components/live/live-viewer"
import { ShareLinks } from "@/components/live/share-links"
import { Button } from "@/components/ui/button"
import { canManageLive, loadLive, toLiveDto } from "@/lib/live/server"
import { siteOrigin } from "@/lib/site"

export const metadata: Metadata = {
  title: "Ubicación en vivo",
  robots: { index: false, follow: false },
}

async function LiveBody({ params }: { params: Promise<{ shareId: string }> }) {
  const live = await loadLive((await params).shareId)
  if (!live) notFound()

  const [dto, manager, origin] = await Promise.all([toLiveDto(live), canManageLive(live), siteOrigin()])
  const url = `${origin}/en-vivo/${live.shareId}`

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-balance text-2xl font-semibold sm:text-3xl">{dto.title ?? dto.trip?.title ?? "Ubicación en vivo"}</h1>
        {dto.trip && (
          <p className="text-sm text-muted-foreground">
            <Link href={`/t/${dto.trip.shareId}`} className="underline underline-offset-4">Ver el ticket del viaje</Link>
          </p>
        )}
      </header>

      <LiveViewer initial={dto} />

      {manager && dto.state === "active" && (
        <>
          <LiveSharer shareId={live.shareId} />
          <section aria-labelledby="share-h" className="space-y-2">
            <h2 id="share-h" className="text-sm font-semibold">Envía este enlace a quien te espera</h2>
            <ShareLinks url={url} title={dto.title ?? "Mi ubicación"} />
          </section>
        </>
      )}

      {manager && dto.state !== "active" && (
        <Button asChild variant="outline">
          <Link href={dto.trip ? `/t/${dto.trip.shareId}` : "/en-vivo"}>{dto.trip ? "Volver al ticket" : "Crear otra sesión"}</Link>
        </Button>
      )}
    </div>
  )
}

export default function LivePage({ params }: PageProps<"/en-vivo/[shareId]">) {
  return (
    <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
      <LiveBody params={params} />
    </Suspense>
  )
}
