/* Service worker de PagaLaGasofa.
 *
 * Qué hace:
 *  - Notificaciones push (con rutas internas validadas).
 *  - Funcionamiento sin conexión ACOTADO: guarda solo recursos estáticos y una página «sin conexión».
 *
 * Qué NO hace, a propósito (la v1 sí lo hacía):
 *  - No guarda navegaciones, ni respuestas de /api, ni datos de RSC, ni nada con sesión o datos personales.
 *  - Solo intercepta GET del mismo origen a rutas estáticas inmutables o a navegaciones (para el fallback).
 *
 * Al cambiar la lista de recursos precargados, sube VERSION.
 */
const VERSION = "v1"
const CACHE = `plg-static-${VERSION}`
const OFFLINE_URL = "/offline"
const PRECACHE = ["/icon-192", "/icon-512", "/icon.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(PRECACHE)
      // La página sin conexión y los recursos que necesita (CSS y JS con hash en su nombre).
      const res = await fetch(OFFLINE_URL, { cache: "reload" })
      if (res.ok) {
        const html = await res.text()
        const assets = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)].map((m) => m[0]))]
        await Promise.allSettled(assets.map((url) => cache.add(url)))
        await cache.put(OFFLINE_URL, new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }))
      }
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n.startsWith("plg-") && n !== CACHE).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

// Recursos estáticos que nunca cambian con su nombre: el build los nombra con un hash.
const isImmutableStatic = (url) =>
  url.pathname.startsWith("/_next/static/") || /^\/icon(-\d+|-maskable)?(\.svg)?$/.test(url.pathname) || /\.woff2$/.test(url.pathname)

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    // Siempre red; si falla, la página sin conexión. Las navegaciones nunca se guardan.
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())))
    return
  }

  if (isImmutableStatic(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request)
        if (hit) return hit
        const res = await fetch(request)
        if (res.ok && res.type === "basic") cache.put(request, res.clone())
        return res
      }),
    )
  }
  // Todo lo demás (API, datos, RSC…) pasa directo a la red sin tocarse.
})

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
