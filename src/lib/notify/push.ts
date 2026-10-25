import "server-only"

import webpush from "web-push"

export interface PushTarget {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushPayload {
  title: string
  body: string
  /** Ruta interna que se abre al pulsar la notificación. */
  url: string
}

let configured = false
function configure() {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:soporte@broslunas.com", publicKey, privateKey)
  configured = true
  return true
}

export const isPushConfigured = () => configure()

/** `gone`: el navegador ya no acepta esta suscripción (404/410) y debe borrarse. */
export type PushResult = "sent" | "gone" | "failed" | "disabled"

export async function sendPush(target: PushTarget, payload: PushPayload): Promise<PushResult> {
  if (!configure()) return "disabled"
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24, urgency: "normal", timeout: 10_000 },
    )
    return "sent"
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return "gone"
    console.warn("sendPush:", status ?? (error as Error).message)
    return "failed"
  }
}
