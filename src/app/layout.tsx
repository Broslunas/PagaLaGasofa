import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"

import { AnalyticsScripts } from "@/components/consent/analytics-scripts"
import { CookieBanner } from "@/components/consent/cookie-banner"
import { RegisterSW } from "@/components/layout/register-sw"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { es } from "@/i18n/es"

import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: es.app.name, template: `%s · ${es.app.name}` },
  description: es.app.description,
  applicationName: es.app.name,
  appleWebApp: { capable: true, title: es.app.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf5" },
    { media: "(prefers-color-scheme: dark)", color: "#12181a" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <RegisterSW />
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          {/* usePathname() en rutas dinámicas exige un límite de Suspense. */}
          <Suspense fallback={null}>
            <SiteFooter />
          </Suspense>
          <CookieBanner />
          <AnalyticsScripts />
        </ThemeProvider>
      </body>
    </html>
  )
}
