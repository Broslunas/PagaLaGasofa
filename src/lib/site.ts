import "server-only"

import { headers } from "next/headers"

/** Origen público de la petición actual (correcto en local, previews y producción). */
export async function siteOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https")
  return `${proto}://${host}`
}
