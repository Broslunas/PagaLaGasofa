import { describe, expect, it } from "vitest"

import { urlBase64ToUint8Array } from "./client"

describe("urlBase64ToUint8Array", () => {
  it("decodifica base64url con y sin relleno", () => {
    expect([...urlBase64ToUint8Array("AQID")]).toEqual([1, 2, 3])
    expect([...urlBase64ToUint8Array("-_8")]).toEqual([251, 255])
  })
  it("una clave VAPID pública mide 65 bytes", () => {
    const key = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
    expect(urlBase64ToUint8Array(key)).toHaveLength(65)
  })
})
