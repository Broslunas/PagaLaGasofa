import { expect, test } from "@playwright/test"

import { skipCookieBanner } from "./helpers"

test("la landing presenta el producto y lleva al calculador", async ({ page }) => {
  await skipCookieBanner(page)
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Reparte la gasofa")
  await page.getByRole("link", { name: "Calcular un viaje" }).first().click()
  await expect(page).toHaveURL(/\/viaje$/)
})

test("la calculadora de la landing calcula con la calculadora real", async ({ page }) => {
  await skipCookieBanner(page)
  await page.goto("/")
  await page.getByLabel("Distancia").fill("700")
  // 700 km · 6,0 l/100 km · 1,55 €/l = 65,10 € entre 4 personas → 16,28 € el primero (el céntimo sobrante se reparte)
  const result = page.locator("[aria-live=polite]", { hasText: "Cada uno paga" })
  await expect(result).toContainText("16,28")
  await expect(result).toContainText("65,10 € en total")
  await page.getByLabel("Personas").fill("1")
  await expect(page.locator("[aria-live=polite]", { hasText: "El viaje te cuesta" })).toContainText("65,10")
})

test.describe("aviso de cookies", () => {
  test("sin decidir no se carga la analítica y «Rechazar» lo guarda", async ({ page }) => {
    await page.goto("/")
    const dialog = page.getByRole("dialog", { name: "Tu privacidad, tu decisión" })
    await expect(dialog).toBeVisible()
    expect(await page.locator('script[src*="analytics"]').count()).toBe(0)

    await dialog.getByRole("button", { name: "Rechazar" }).click()
    await expect(dialog).toBeHidden()
    expect(await page.locator('script[src*="analytics"]').count()).toBe(0)

    // La decisión se recuerda al navegar y se puede reabrir desde el pie.
    await page.goto("/legal/cookies")
    await expect(dialog).toBeHidden()
    await page.getByRole("button", { name: "Preferencias de cookies" }).first().click()
    await expect(dialog).toBeVisible()
  })

  test("«Configurar» no activa nada por defecto", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Configurar" }).click()
    await expect(page.getByRole("switch", { name: /Cookies imprescindibles/ })).toBeChecked()
    await expect(page.locator("#c-analytics")).not.toBeChecked()
    await expect(page.locator("#c-recording")).toBeDisabled()
  })
})
