"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { CookiePreferencesButton } from "@/components/consent/cookie-preferences-button"
import { LogoMark } from "@/components/brand/logo"

/** Pantallas de mapa a pantalla completa: no llevan pie. */
const NO_FOOTER = ["/viaje", "/gasolineras"]

const links = [
  { title: "La app", items: [["/viaje", "Calcular un viaje"], ["/gasolineras", "Gasolineras"], ["/en-vivo", "Ubicación en vivo"], ["/dashboard", "Mi cuenta"]] },
  { title: "Legal", items: [["/legal/aviso-legal", "Aviso legal"], ["/legal/privacidad", "Privacidad"], ["/legal/cookies", "Cookies"], ["/legal/terminos", "Términos de uso"]] },
] as const

export function SiteFooter() {
  const pathname = usePathname()
  if (NO_FOOTER.includes(pathname)) return null

  return (
    <footer className="bg-secondary">
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10">
        <div className="flex items-end gap-3">
          <LogoMark className="size-12 sm:size-16" />
          <p className="font-heading text-[clamp(2.25rem,9vw,5.5rem)] leading-[0.95] font-semibold tracking-tight">PagaLaGasofa</p>
        </div>
        <p className="mt-3 max-w-md text-muted-foreground">Reparte el coste del viaje. Sin discusiones.</p>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {links.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="mb-3 font-semibold">{group.title}</p>
              <ul className="space-y-2">
                {group.items.map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-foreground/80 underline-offset-4 hover:underline">{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <p className="mb-3 font-semibold">Tus datos</p>
            <CookiePreferencesButton className="h-10" />
          </div>
        </div>

        <p className="mt-10 max-w-3xl text-sm text-muted-foreground">
          Precios y horarios de gasolineras: MITECO. Consumo de coches: Agencia Europea de Medio Ambiente. Mapas y rutas: © colaboradores de{" "}
          <a href="https://www.openstreetmap.org/copyright" className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>,
          OpenFreeMap, OSRM y Photon.
        </p>
      </div>
    </footer>
  )
}
