import { expect, test } from "@playwright/test"

import { mockExternalServices, skipCookieBanner } from "./helpers"

// Crea un ticket de verdad (con la base de datos real), lo cobra y lo borra al terminar.
test("viaje → ticket → pago, visto por el gestor y por un visitante", async ({ page, browser }) => {
  await skipCookieBanner(page)
  await mockExternalServices(page)
  await page.goto("/viaje")

  // Paso 1: ruta
  await page.getByRole("combobox", { name: "Origen" }).fill("Madrid")
  await page.getByRole("option", { name: /Puerta del Sol/ }).click()
  await page.getByRole("combobox", { name: "Destino" }).fill("Valencia")
  await page.getByRole("option", { name: /Plaza del Ayuntamiento/ }).click()
  await expect(page.getByText("355 km")).toBeVisible()
  await page.getByRole("button", { name: "Siguiente" }).click()

  // Paso 2: coste (sin esperar nada de internet: el consumo y el precio se escriben)
  await page.getByLabel("Consumo", { exact: true }).fill("5,5")
  await page.getByLabel("Precio del combustible").fill("1,50")
  await page.getByLabel("Peajes (total)").fill("10")
  await page.getByRole("button", { name: "Siguiente" }).click()

  // Paso 3: pasajeros (el conductor y uno más; se añade un tercero)
  await page.getByRole("button", { name: "Añadir pasajero" }).click()
  await expect(page.getByLabel("Nombre del pasajero 2")).toBeVisible()
  await page.getByRole("button", { name: "Siguiente" }).click()

  // Paso 4: resumen y creación
  await expect(page.getByText("Total del viaje")).toBeVisible()
  await page.getByLabel("Título del viaje (opcional)").fill("__e2e__ Madrid-Valencia")
  await page.getByRole("button", { name: "Crear ticket" }).click()

  await page.waitForURL(/\/t\/[0-9A-Za-z]{12}$/)
  const shareId = page.url().split("/t/")[1]
  const manager = page.context()

  try {
    // 355 km · 5,5 l/100 km · 1,50 €/l = 29,29 € + 10 € de peajes = 39,29 €
    await expect(page.getByRole("heading", { level: 1 })).toContainText("__e2e__")
    await expect(page.getByText("39,29 €").first()).toBeVisible()
    await expect(page.getByText("Gestionas este ticket")).toBeVisible()

    // El gestor marca un pago; se conserva al recargar.
    await page.getByRole("switch", { name: "Persona 1 ha pagado" }).click()
    await expect(page.getByText("1 de 2 han pagado")).toBeVisible()
    await page.reload()
    await expect(page.getByText("1 de 2 han pagado")).toBeVisible()

    // Un visitante (sin la cookie de gestión) ve el estado, pero no puede cambiarlo.
    const visitorContext = await browser.newContext()
    await skipCookieBanner(visitorContext)
    const visitor = await visitorContext.newPage()
    await visitor.goto(`/t/${shareId}`)
    await expect(visitor.getByText("1 de 2 han pagado")).toBeVisible()
    await expect(visitor.getByRole("switch")).toHaveCount(0)
    await expect(visitor.getByText("Gestionas este ticket")).toHaveCount(0)
    const denied = await visitorContext.request.patch(`/api/trips/${shareId}/passengers/1`, { data: { hasPaid: false } })
    expect(denied.status()).toBe(403)

    // PDF e imagen para compartir.
    const pdf = await visitorContext.request.get(`/t/${shareId}/pdf`)
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()["content-type"]).toContain("application/pdf")
    expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF")
    expect((await visitorContext.request.get(`/t/${shareId}/opengraph-image`)).headers()["content-type"]).toContain("image/png")
    await visitorContext.close()
  } finally {
    // Limpieza: el gestor borra el ticket de prueba.
    const del = await manager.request.delete(`/api/trips/${shareId}`)
    expect(del.status()).toBe(204)
  }
  const gone = await page.goto(`/t/${shareId}`)
  expect(gone?.status()).toBeLessThan(500)
  await expect(page.getByText("No encontramos este ticket")).toBeVisible()
})
