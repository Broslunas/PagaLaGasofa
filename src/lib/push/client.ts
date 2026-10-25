// Web Push en el navegador: permisos, suscripción y alta/baja en el servidor.

export type PushSupport = "supported" | "unsupported" | "needs-install"

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported"
  if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) return "supported"
  // iOS solo permite Web Push desde una PWA instalada en la pantalla de inicio.
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return ios ? "needs-install" : "unsupported"
}

/** La clave pública VAPID viene en base64url; el navegador la quiere como bytes. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null
  return navigator.serviceWorker.register("/sw.js", { scope: "/" })
}

export async function currentSubscription() {
  if (pushSupport() !== "supported") return null
  const registration = await navigator.serviceWorker.getRegistration("/")
  return (await registration?.pushManager.getSubscription()) ?? null
}

export type SubscribeResult = "subscribed" | "denied" | "unsupported" | "error"

/** Debe llamarse desde un gesto del usuario (clic): los navegadores bloquean el permiso si no. */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (pushSupport() !== "supported") return "unsupported"
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) return "error"

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission()
  if (permission !== "granted") return "denied"

  try {
    const registration = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready)
    await navigator.serviceWorker.ready
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }))
    const res = await fetch("/api/push/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    })
    return res.ok ? "subscribed" : "error"
  } catch {
    return "error"
  }
}

export async function unsubscribeFromPush() {
  const subscription = await currentSubscription()
  if (!subscription) return
  await fetch(`/api/push/subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`, { method: "DELETE" }).catch(() => {})
  await subscription.unsubscribe().catch(() => {})
}
