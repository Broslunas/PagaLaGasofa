const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

/** Cadena aleatoria base62 sin sesgo (rechazo de bytes fuera de rango). */
function randomBase62(length: number) {
  const limit = 256 - (256 % BASE62.length)
  let out = ""
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2))
    for (const b of bytes) {
      if (b < limit && out.length < length) out += BASE62[b % BASE62.length]
    }
  }
  return out
}

/** Identificador público del enlace de lectura: 12 caracteres ≈ 71 bits de entropía. */
export const generateShareId = () => randomBase62(12)

/** Token secreto de gestión: 32 caracteres ≈ 190 bits. Solo se guarda su hash. */
export const generateManageToken = () => randomBase62(32)

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}

export const SHARE_ID_PATTERN = /^[0-9A-Za-z]{12}$/
