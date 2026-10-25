/**
 * Devuelve una ruta interna segura para redirigir tras el login.
 * Evita open redirects: solo se admiten rutas relativas al mismo origen.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/app"): string {
  if (!next) return fallback
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  if (/[\u0000-\u001f]/.test(next)) return fallback
  return next
}
