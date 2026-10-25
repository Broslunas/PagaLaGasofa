import { describe, expect, it } from "vitest"

import { DARK_BACKGROUND, darkenColor, toDarkStyle } from "./style"

const lightness = (hsla: string) => Number(hsla.match(/hsla\([\d.]+, [\d.]+%, ([\d.]+)%/)![1])

describe("darkenColor", () => {
  it("invierte la luminosidad", () => {
    expect(lightness(darkenColor("#ffffff"))).toBeLessThan(15)
    expect(lightness(darkenColor("#000000"))).toBeGreaterThan(80)
  })
  it("acepta hex corto, rgb y hsl y conserva el alfa", () => {
    expect(darkenColor("#fff")).toMatch(/^hsla\(/)
    expect(darkenColor("rgba(255, 255, 255, 0.5)")).toMatch(/, 0\.5\)$/)
    expect(darkenColor("hsla(0,0%,85%,0.53)")).toMatch(/, 0\.53\)$/)
  })
  it("deja intactos los valores que no son colores", () => {
    expect(darkenColor("transparent")).toBe("transparent")
  })
})

describe("toDarkStyle", () => {
  const style = {
    version: 8,
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#f8f4f0" } },
      { id: "relief", type: "raster", paint: {} },
      {
        id: "road",
        type: "line",
        paint: {
          "line-color": ["interpolate", ["linear"], ["zoom"], 5, "hsla(0,0%,85%,0.5)", 6, "#fff"],
          "line-width": 2,
        },
      },
    ],
  }
  const dark = toDarkStyle(style)

  it("quita las capas raster y fija el fondo oscuro", () => {
    expect(dark.layers.map((l) => l.id)).toEqual(["bg", "road"])
    expect(dark.layers[0].paint!["background-color"]).toBe(DARK_BACKGROUND)
  })
  it("transforma colores dentro de expresiones sin tocar los operadores", () => {
    const color = dark.layers[1].paint!["line-color"] as unknown[]
    expect(color.slice(0, 3)).toEqual(["interpolate", ["linear"], ["zoom"]])
    expect(String(color[4])).toMatch(/^hsla\(/)
    expect(dark.layers[1].paint!["line-width"]).toBe(2)
  })
  it("no modifica el estilo original", () => {
    expect(style.layers).toHaveLength(3)
    expect(style.layers[0].paint["background-color"]).toBe("#f8f4f0")
  })
})

import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec"

import positron from "./__fixtures__/positron.json"

describe("estilo real de OpenFreeMap", () => {
  it("el estilo claro es válido (control)", () => {
    expect(validateStyleMin(positron as never)).toEqual([])
  })

  it("el estilo oscuro generado también cumple la especificación", () => {
    const dark = toDarkStyle(positron as unknown as { layers: { id: string; type: string }[] })
    expect(validateStyleMin(dark as never)).toEqual([])
    expect(dark.layers.some((l) => l.type === "raster")).toBe(false)
  })
})
