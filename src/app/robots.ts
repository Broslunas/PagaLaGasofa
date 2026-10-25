import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pagalagasofa.broslunas.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Páginas privadas o con enlaces secretos: no deben indexarse.
        disallow: ["/api/", "/dashboard", "/ajustes", "/login", "/auth/", "/t/", "/en-vivo/", "/app", "/offline", "/design"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
