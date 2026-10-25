import type { MetadataRoute } from "next"


const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pagalagasofa.broslunas.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["/", 1],
    ["/viaje", 0.9],
    ["/gasolineras", 0.9],
    ["/en-vivo", 0.6],
    ["/legal/aviso-legal", 0.2],
    ["/legal/privacidad", 0.2],
    ["/legal/cookies", 0.2],
    ["/legal/terminos", 0.2],
  ]
  return pages.map(([path, priority]) => ({
    url: `${BASE}${path}`,
    priority,
    changeFrequency: path === "/gasolineras" ? "daily" : "monthly",
    lastModified: path.startsWith("/legal") ? new Date("2026-10-25") : undefined,
  }))
}
