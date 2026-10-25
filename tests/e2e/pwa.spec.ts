import { expect, test } from "@playwright/test"

import { skipCookieBanner } from "./helpers"

test("el manifest describe una app instalable", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest")
  expect(res.ok()).toBe(true)
  const manifest = await res.json()
  expect(manifest).toMatchObject({ name: "PagaLaGasofa", start_url: "/app", display: "standalone", lang: "es" })
  expect(manifest.icons.map((i: { purpose: string }) => i.purpose)).toEqual(expect.arrayContaining(["any", "maskable"]))
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true)
})

test("el service worker solo guarda estáticos y muestra «Sin conexión» al perder la red", async ({ page, context }) => {
  await skipCookieBanner(page)
  await page.goto("/")
  await page.evaluate(() => navigator.serviceWorker.ready)
  // Espera a que termine la precarga (la página sin conexión y sus recursos).
  await expect.poll(() => page.evaluate(async () => (await caches.has("plg-static-v1")) && Boolean(await (await caches.open("plg-static-v1")).match("/offline")))).toBe(true)

  // Peticiones con datos: no deben acabar nunca en la caché.
  await page.goto("/gasolineras")
  await page.evaluate(() => Promise.all([fetch("/api/stations/brands"), fetch("/api/account/settings")]))
  const cached = await page.evaluate(async () => {
    const out: string[] = []
    for (const name of await caches.keys()) for (const r of await (await caches.open(name)).keys()) out.push(new URL(r.url).pathname)
    return out
  })
  expect(cached.length).toBeGreaterThan(0)
  expect(cached.filter((p) => p.startsWith("/api") || p === "/gasolineras" || p === "/" || p.startsWith("/dashboard") || p.startsWith("/t/"))).toEqual([])

  // Sin red: cualquier navegación cae en la página sin conexión.
  await context.setOffline(true)
  await page.goto("/viaje").catch(() => {})
  await expect(page.getByRole("heading", { name: "Sin conexión" })).toBeVisible()
  await context.setOffline(false)
})
