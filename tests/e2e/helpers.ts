import type { BrowserContext, Page } from "@playwright/test"

/** Sin aviso de cookies: la decisión ya está tomada (rechazar), para que no tape nada. */
export async function skipCookieBanner(target: Page | BrowserContext) {
  await target.addInitScript(() => {
    localStorage.setItem("plg:consent", JSON.stringify({ analytics: false, recording: false, version: 1, at: Date.now() }))
  })
}

const PLACES = {
  madrid: { id: "n1", label: "Puerta del Sol, Madrid, España", title: "Puerta del Sol", subtitle: "Madrid, España", lat: 40.4168, lng: -3.7038 },
  valencia: { id: "n2", label: "Plaza del Ayuntamiento, Valencia, España", title: "Plaza del Ayuntamiento", subtitle: "Valencia, España", lat: 39.4699, lng: -0.3763 },
}

/**
 * Los servicios externos (OSRM, Photon, teselas del mapa) se sustituyen por respuestas fijas:
 * las pruebas no dependen de internet ni de la disponibilidad de terceros.
 */
export async function mockExternalServices(page: Page) {
  await page.route("**/api/geocode**", (route) => {
    const q = new URL(route.request().url()).searchParams.get("q")?.toLowerCase() ?? ""
    route.fulfill({ json: { results: q.includes("val") ? [PLACES.valencia] : [PLACES.madrid] } })
  })
  await page.route("**/api/reverse-geocode**", (route) => route.fulfill({ json: { result: PLACES.madrid } }))
  await page.route("**/api/route", (route) =>
    route.fulfill({
      json: {
        distanceKm: 355,
        durationMin: 230,
        legsKm: [355],
        geometry: [[-3.7038, 40.4168], [-2.1, 40.0], [-0.3763, 39.4699]],
      },
    }),
  )
  await page.route(/tiles\.openfreemap\.org/, (route) => route.abort())
}
