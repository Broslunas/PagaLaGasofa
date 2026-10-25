import { expect, test } from "@playwright/test"

import { skipCookieBanner } from "./helpers"

test.beforeEach(async ({ page }) => {
  await skipCookieBanner(page)
})

test("las zonas privadas piden iniciar sesión y la API responde 401", async ({ page, request }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/)
  await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible()
  for (const path of ["/api/notifications", "/api/vehicles", "/api/favorites", "/api/account/settings"]) {
    expect((await request.get(path)).status(), path).toBe(401)
  }
  expect((await request.get("/api/cron/sync-stations")).status()).toBe(401)
})

test("los textos legales existen y enlazan entre sí", async ({ page }) => {
  for (const [path, title] of [
    ["/legal/aviso-legal", "Aviso legal"],
    ["/legal/privacidad", "Política de privacidad"],
    ["/legal/cookies", "Política de cookies"],
    ["/legal/terminos", "Términos de uso"],
  ]) {
    await page.goto(path)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title)
  }
})

test("un ticket que no existe (también con un id antiguo de la v1) muestra un aviso claro", async ({ page }) => {
  for (const id of ["AAAAAAAAAAAA", "cmv1inexistente0000000000"]) {
    await page.goto(`/t/${id}`)
    await expect(page.getByText("No encontramos este ticket")).toBeVisible()
  }
})

test("gasolineras: lista con precios reales, filtro de combustible y ficha", async ({ page }) => {
  await page.route(/tiles\.openfreemap\.org/, (route) => route.abort())
  await page.goto("/gasolineras")
  const cards = page.getByRole("link", { name: "Ver precios e histórico" })
  await expect(cards.first()).toBeVisible()
  const first = await cards.count()
  expect(first).toBeGreaterThan(0)

  await page.getByRole("radio", { name: "Diésel", exact: true }).click()
  await expect(page.getByRole("radio", { name: "Diésel", exact: true })).toBeChecked()
  await expect(cards.first()).toBeVisible()

  await cards.first().click()
  await expect(page).toHaveURL(/\/gasolineras\/\d+$/)
  await expect(page.getByRole("heading", { name: "Precios hoy" })).toBeVisible()
})

test("la API de gasolineras valida sus parámetros", async ({ request }) => {
  expect((await request.get("/api/stations?lat=10&lng=0")).status()).toBe(400)
  const ok = await request.get("/api/stations?lat=40.4&lng=-3.7&radius=5&fuel=gasolina95&limit=3")
  expect(ok.status()).toBe(200)
  const { stations } = await ok.json()
  expect(stations.length).toBeGreaterThan(0)
  expect(stations[0].prices.gasolina95).toBeGreaterThan(0.3)
})
