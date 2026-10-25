import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "PagaLaGasofa",
    short_name: "PagaLaGasofa",
    description: "Reparte el coste del viaje. Sin discusiones. Calcula, comparte el ticket y encuentra la gasolina más barata.",
    lang: "es",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfaf5",
    theme_color: "#fbfaf5",
    categories: ["travel", "utilities", "finance"],
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Calcular un viaje", short_name: "Viaje", url: "/viaje", icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }] },
      { name: "Gasolineras cerca", short_name: "Gasolineras", url: "/gasolineras", icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }] },
      { name: "Compartir ubicación", short_name: "En vivo", url: "/en-vivo", icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }] },
    ],
  }
}
