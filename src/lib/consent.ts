// Consentimiento de cookies y tecnologías similares. Se guarda solo en el navegador (localStorage).
// Lo estrictamente necesario (sesión, permisos de un ticket, preferencias) no requiere consentimiento.

export interface Consent {
  /** Estadísticas de uso agregadas. */
  analytics: boolean
  /** Grabación de sesión (cómo se usa la interfaz). Solo si además se acepta la analítica. */
  recording: boolean
  /** Versión de la política con la que se decidió; si cambia, se vuelve a preguntar. */
  version: number
  /** Marca de tiempo (ms). */
  at: number
}

export const CONSENT_VERSION = 1
export const CONSENT_KEY = "plg:consent"
/** El consentimiento se renueva cada 12 meses. */
export const CONSENT_TTL_MS = 365 * 24 * 3600 * 1000

export const ANALYTICS = {
  script: "https://analytics.broslunas.com/script.js",
  recorder: "https://analytics.broslunas.com/recorder.js",
  websiteId: "8d168ceb-6508-4650-be70-f60f7aae96f4",
} as const

export function parseConsent(raw: string | null, now = Date.now()): Consent | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Consent>
    if (typeof value.analytics !== "boolean" || typeof value.recording !== "boolean") return null
    if (value.version !== CONSENT_VERSION || typeof value.at !== "number") return null
    if (now - value.at > CONSENT_TTL_MS) return null
    // La grabación nunca se activa sin la analítica.
    return { ...(value as Consent), recording: value.analytics && value.recording }
  } catch {
    return null
  }
}

export const makeConsent = (analytics: boolean, recording: boolean, now = Date.now()): Consent => ({
  analytics,
  recording: analytics && recording,
  version: CONSENT_VERSION,
  at: now,
})
