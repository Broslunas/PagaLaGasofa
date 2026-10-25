/**
 * Estilos de mapa vectorial de OpenFreeMap (gratuito, sin clave, uso comercial permitido).
 * El modo oscuro se genera a partir del estilo claro invirtiendo la luminosidad de los colores.
 */
export const LIGHT_STYLE_URL = "https://tiles.openfreemap.org/styles/positron"
export const DARK_BACKGROUND = "#12181a"

type Rgba = { r: number; g: number; b: number; a: number }

function parseColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase()

  const hex = s.match(/^#([0-9a-f]{3,8})$/)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("")
    if (h.length !== 6 && h.length !== 8) return null
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    }
  }

  const rgb = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: rgb[4] === undefined ? 1 : +rgb[4] }

  const hsl = s.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (hsl) {
    const [h, sat, l] = [+hsl[1], +hsl[2] / 100, +hsl[3] / 100]
    const k = (n: number) => (n + h / 30) % 12
    const aa = sat * Math.min(l, 1 - l)
    const f = (n: number) => l - aa * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a: hsl[4] === undefined ? 1 : +hsl[4] }
  }
  return null
}

function rgbToHsl({ r, g, b }: Rgba) {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h =
    max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return { h: (h * 60 + 360) % 360, s, l }
}

/** Invierte la luminosidad conservando el matiz, con un suelo oscuro y un techo suave. */
export function darkenColor(input: string): string {
  const rgba = parseColor(input)
  if (!rgba) return input
  const { h, s, l } = rgbToHsl(rgba)
  const nl = 0.1 + (1 - l) * 0.78
  const ns = Math.min(s, 0.25)
  return `hsla(${h.toFixed(0)}, ${(ns * 100).toFixed(0)}%, ${(nl * 100).toFixed(1)}%, ${rgba.a})`
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

function mapColors(value: Json): Json {
  if (typeof value === "string") return darkenColor(value)
  if (Array.isArray(value)) return value.map((v, i) => (i === 0 && typeof v === "string" ? v : mapColors(v)))
  return value
}

interface StyleLike {
  layers: { id: string; type: string; paint?: Record<string, unknown>; [key: string]: unknown }[]
  [key: string]: unknown
}

export function toDarkStyle<T extends StyleLike>(style: T): T {
  const layers = style.layers
    // Las capas raster (relieve de Natural Earth) son claras y no se pueden invertir.
    .filter((layer) => layer.type !== "raster")
    .map((layer) => {
      if (!layer.paint) return layer
      const paint = Object.fromEntries(
        Object.entries(layer.paint).map(([key, value]) => [
          key,
          key.endsWith("-color") ? mapColors(value as Json) : value,
        ]),
      )
      if (layer.type === "background") paint["background-color"] = DARK_BACKGROUND
      return { ...layer, paint }
    })
  return { ...style, layers }
}

const cache = new Map<string, Promise<StyleLike>>()

export function loadMapStyle(theme: "light" | "dark"): Promise<StyleLike> {
  if (!cache.has("light")) {
    cache.set(
      "light",
      fetch(LIGHT_STYLE_URL).then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el estilo del mapa")
        return res.json()
      }),
    )
  }
  const light = cache.get("light")!
  if (!cache.has("dark")) cache.set("dark", light.then(toDarkStyle))
  // MapLibre puede modificar el objeto que recibe: se entrega siempre una copia.
  return cache.get(theme)!.then((style) => structuredClone(style))
}
