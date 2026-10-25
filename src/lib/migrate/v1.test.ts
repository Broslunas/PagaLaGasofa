import { describe, expect, it } from "vitest"

import { LEGACY_SHARE_ID, mapFuel, mapSnapshot, mapTrip, mapUser, mapVehicle, snapshotDay, splitLegs, stableUuid, type V1Trip } from "./v1"

const trip = (over: Partial<V1Trip> = {}): V1Trip => ({
  _id: "65f000000000000000000001",
  userId: "65f0000000000000000000aa",
  origin: "Madrid", destination: "Valencia", title: "Puente",
  originLat: 40.4168, originLon: -3.7038, destLat: 39.4699, destLon: -0.3763,
  geometry: JSON.stringify([[40.4168, -3.7038], [40.0, -2.1], [39.4699, -0.3763]]),
  waypoints: [],
  distanceKm: 355, isRoundTrip: true,
  consumptionL100: 5.5, fuelPricePerLiter: 1.5, fuelType: "diesel",
  tollsCost: 10, extraCosts: 6,
  totalCost: 74.58, shareId: "cmabc1234567890abcdefghij",
  passengers: [
    { name: "Ana", amount: 24.86, hasPaid: true },
    { name: "Luis", amount: 24.86, hasPaid: false },
    { name: "Eva", amount: 24.86, hasPaid: true },
  ],
  createdAt: "2026-05-01T10:00:00Z",
  ...over,
})

describe("stableUuid", () => {
  it("es determinista, distinto por tipo e id, y con forma de UUID v5", () => {
    expect(stableUuid("trip", "a")).toBe(stableUuid("trip", "a"))
    expect(stableUuid("trip", "a")).not.toBe(stableUuid("trip", "b"))
    expect(stableUuid("trip", "a")).not.toBe(stableUuid("vehicle", "a"))
    expect(stableUuid("trip", "a")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})

describe("mapUser", () => {
  it("normaliza el correo y conserva el sub de Google", () => {
    const u = mapUser({ _id: "u1", email: " Pablo@Example.COM ", name: "Pablo", image: "x" }, [{ userId: "u1", provider: "google", providerAccountId: "114" }])
    expect(u).toMatchObject({ email: "pablo@example.com", googleSub: "114", name: "Pablo" })
  })
  it("sin correo no se migra", () => {
    expect(mapUser({ _id: "u2", email: null }, [])).toBeNull()
    expect(mapUser({ _id: "u3", email: "sin-arroba" }, [])).toBeNull()
  })
})

describe("mapVehicle", () => {
  it("convierte combustible, año y consumo", () => {
    expect(mapVehicle({ _id: "v1", userId: "u", brand: " SEAT ", model: "Ibiza", year: 2021, fuelType: "diesel", avgConsumption: 4.567, isDefault: true })).toMatchObject({
      brand: "SEAT", year: 2021, fuelType: "diesel", consumptionPer100km: 4.57, isDefault: true,
    })
  })
  it("combustible desconocido → gasolina 95; año 0 → null; consumo absurdo → descartado", () => {
    expect(mapVehicle({ _id: "v", userId: "u", brand: "A", model: "B", year: 0, fuelType: "agua", avgConsumption: 6 })).toMatchObject({ fuelType: "gasolina95", year: null })
    expect(mapVehicle({ _id: "v", userId: "u", brand: "A", model: "B", avgConsumption: 0 })).toBeNull()
    expect(mapVehicle({ _id: "v", userId: "u", brand: "", model: "B", avgConsumption: 5 })).toBeNull()
  })
  it("mapFuel", () => {
    expect(mapFuel("glp")).toBe("glp")
    expect(mapFuel(null)).toBe("gasolina95")
  })
})

describe("mapTrip", () => {
  it("convierte un viaje ida y vuelta conservando el total y los importes de la v1", () => {
    const r = mapTrip(trip())
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const { trip: t, passengers } = r.value
    expect(t.shareId).toBe("cmabc1234567890abcdefghij")
    expect(LEGACY_SHARE_ID.test(t.shareId)).toBe(true)
    expect(t.distanceKm).toBe(710) // ida y vuelta
    expect(t.legsKm).toEqual([355]) // un tramo: la distancia de ida
    expect(t.totalCents).toBe(7458)
    expect(t.tollsCents).toBe(1000)
    expect(t.extras).toEqual([{ label: "Otros gastos", amountCents: 600 }])
    expect(t.energyCents + t.tollsCents + 600).toBe(t.totalCents) // las partes suman el total
    expect(t.energyUnits).toBeCloseTo(39.05, 2)
    expect(passengers.map((p) => p.amountCents)).toEqual([2486, 2486, 2486])
    expect(passengers[2].hasPaid).toBe(true)
  })
  it("la geometría pasa de [lat, lon] a [lng, lat]", () => {
    const r = mapTrip(trip())
    if (!r.ok) throw new Error("debería convertirse")
    expect(r.value.trip.geometry[0]).toEqual([-3.7038, 40.4168])
    expect(r.value.trip.stops[0]).toMatchObject({ lat: 40.4168, lng: -3.7038 })
  })
  it("con paradas reparte los tramos y valida subidas y bajadas", () => {
    const r = mapTrip(trip({
      waypoints: [{ label: "Cuenca", lat: 40.07, lon: -2.13 }],
      passengers: [{ name: "Ana", amount: 10 }, { name: "Luis", amount: 10, pickupStop: 0, dropoffStop: 2 }, { name: "Eva", amount: 5, pickupStop: 1, dropoffStop: 2 }, { name: "Raro", amount: 5, pickupStop: 5, dropoffStop: 1 }],
    }))
    if (!r.ok) throw new Error("debería convertirse")
    const { trip: t, passengers } = r.value
    expect(t.stops).toHaveLength(3)
    expect(t.legsKm).toHaveLength(2)
    expect(t.legsKm[0] + t.legsKm[1]).toBeCloseTo(355, 2)
    expect(passengers.map((p) => [p.pickupStop, p.dropoffStop])).toEqual([[0, 2], [0, 2], [1, 2], [0, 2]])
  })
  it("sin coordenadas de origen se recupera de la geometría; sin ninguna, se descarta", () => {
    const sinOrigen = mapTrip(trip({ originLat: null, originLon: null }))
    expect(sinOrigen.ok).toBe(true)
    expect(mapTrip(trip({ originLat: null, originLon: null, geometry: null }))).toEqual({ ok: false, reason: "sin-coordenadas" })
  })
  it("descarta datos inválidos o sin pasajeros", () => {
    expect(mapTrip(trip({ distanceKm: 0 }))).toEqual({ ok: false, reason: "datos-no-validos" })
    expect(mapTrip(trip({ totalCost: NaN }))).toEqual({ ok: false, reason: "datos-no-validos" })
    expect(mapTrip(trip({ passengers: [] }))).toEqual({ ok: false, reason: "sin-pasajeros" })
  })
  it("un viaje anónimo no trae propietario", () => {
    const r = mapTrip(trip({ userId: null }))
    expect(r.ok && r.value.trip.v1UserId).toBeNull()
  })
})

describe("splitLegs", () => {
  it("la suma de tramos es exactamente la distancia", () => {
    const legs = splitLegs(355.37, [{ lat: 40, lng: -3 }, { lat: 40.5, lng: -2 }, { lat: 39.9, lng: -1 }, { lat: 39.5, lng: -0.4 }])
    expect(legs).toHaveLength(3)
    expect(legs.reduce((a, b) => a + b, 0)).toBeCloseTo(355.37, 2)
  })
  it("un solo tramo", () => expect(splitLegs(100, [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }])).toEqual([100]))
})

describe("histórico", () => {
  it("snapshotDay", () => {
    expect(snapshotDay("05-03-2026")).toBe("2026-03-05")
    expect(snapshotDay("31-02-2026")).toBeNull()
    expect(snapshotDay("2026-03-05")).toBeNull()
  })
  it("mapSnapshot conserva los 5 combustibles y descarta precios absurdos", () => {
    expect(mapSnapshot({ stationId: "1", date: "05-03-2026", gasolina95: 1.659, diesel: 1.55, glp: 99 })).toEqual({
      stationId: "1", day: "2026-03-05", gasolina95: 1.659, gasolina98: null, diesel: 1.55, dieselPremium: null, glp: null,
    })
    expect(mapSnapshot({ stationId: "1", date: "05-03-2026" })).toBeNull()
    expect(mapSnapshot({ stationId: "1", date: "mal", diesel: 1.5 })).toBeNull()
  })
})
