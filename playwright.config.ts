import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

/**
 * Pruebas de extremo a extremo. Necesitan la app compilada (`pnpm build`) y las variables de `.env.local`
 * (usan la base de datos real: los tickets que crean llevan «__e2e__» en el título y se borran al terminar).
 * Si se define E2E_BASE_URL se prueba esa URL en vez de arrancar un servidor local.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure", locale: "es-ES", timezoneId: "Europe/Madrid" },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil", use: { ...devices["Pixel 7"] }, testMatch: /(landing|trip)\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm exec next start -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
})
