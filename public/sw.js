/* Service worker de PagaLaGasofa.
 *
 * Solo gestiona notificaciones push. A propósito NO intercepta peticiones ni guarda nada en caché:
 * así no puede quedarse con respuestas de la API ni con datos de sesión (la v1 sí lo hacía).
 * El modo sin conexión de la PWA se añade en la Fase 11 con una caché limitada a recursos estáticos.
 */

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

// Solo se admiten rutas internas del propio sitio.
function safeUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/"
  return value
}

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : "" }
  }
  const title = typeof data.title === "string" && data.title ? data.title.slice(0, 120) : "PagaLaGasofa"
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === "string" ? data.body.slice(0, 300) : "",
      icon: "/icon-192",
      badge: "/icon-192",
      data: { url: safeUrl(data.url) },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = new URL(safeUrl(event.notification.data && event.notification.data.url), self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          return client.navigate(target).then((c) => (c || client).focus())
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
