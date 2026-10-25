import { describe, expect, it } from "vitest"

import { manageUrl, mapsDirectionsUrl, parseManageFragment, shareMessage, shortPlace, tripTitle, whatsappUrl } from "./share"

const stops = [
  { label: "Puerta del Sol, Madrid, España", lat: 40.4168, lng: -3.7038 },
  { label: "Cuenca, Castilla-La Mancha", lat: 40.07, lng: -2.13 },
  { label: "Valencia, España", lat: 39.47, lng: -0.37 },
]

describe("share", () => {
  it("títulos", () => {
    expect(shortPlace("Calle Mayor, Madrid")).toBe("Calle Mayor")
    expect(tripTitle(null, stops)).toBe("Puerta del Sol → Valencia")
    expect(tripTitle("  Escapada  ", stops)).toBe("Escapada")
  })
  it("enlace de Google Maps con paradas", () => {
    const url = new URL(mapsDirectionsUrl(stops))
    expect(url.searchParams.get("origin")).toBe("40.4168,-3.7038")
    expect(url.searchParams.get("destination")).toBe("39.47,-0.37")
    expect(url.searchParams.get("waypoints")).toBe("40.07,-2.13")
  })
  it("sin paradas no añade waypoints", () => {
    expect(new URL(mapsDirectionsUrl([stops[0], stops[2]])).searchParams.has("waypoints")).toBe(false)
  })
  it("mensaje y WhatsApp", () => {
    const text = shareMessage({ title: "Viaje", totalCents: 8819, url: "https://x.es/t/abc" })
    expect(text).toContain("88,19")
    expect(whatsappUrl(text)).toMatch(/^https:\/\/wa\.me\/\?text=/)
  })
  it("fragmento de gestión", () => {
    const token = "A".repeat(32)
    expect(manageUrl("https://x.es", "abc", token)).toBe(`https://x.es/t/abc#gestion=${token}`)
    expect(parseManageFragment(`#gestion=${token}`)).toBe(token)
    expect(parseManageFragment("#gestion=corto")).toBeNull()
    expect(parseManageFragment("")).toBeNull()
  })
})
