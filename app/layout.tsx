import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/auth/session-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { RegisterSW } from "@/components/layout/register-sw";
import { InstallPrompt } from "@/components/layout/install-prompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pagalagasofa.broslunas.com"),
  title: "PagaLaGasofa — Reparte la gasolina entre amigos",
  description: "Calcula distancia, consumo y reparte el gasto de gasolina entre amigos de forma justa y rápida.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  openGraph: {
    title: "PagaLaGasofa — Reparte la gasolina entre amigos",
    description: "Calcula distancia, consumo y reparte el gasto de gasolina entre amigos de forma justa y rápida.",
    url: "https://pagalagasofa.broslunas.com",
    siteName: "PagaLaGasofa",
    locale: "es_ES",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PagaLaGasofa",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col">
        <ThemeProvider>
          <SessionProvider>
            <RegisterSW />
            <Header />
            {children}
            <ConditionalFooter />
            <InstallPrompt />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
