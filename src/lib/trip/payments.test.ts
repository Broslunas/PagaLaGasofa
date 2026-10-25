import { describe, expect, it } from "vitest"

import { paymentProgress, payingPassengers } from "./payments"

const p = (position: number, amountCents: number, hasPaid = false) => ({ position, amountCents, hasPaid })

describe("payments", () => {
  const list = [p(0, 2000), p(1, 2000, true), p(2, 1500), p(3, 0)]
  it("excluye al conductor y los importes de 0 €", () => {
    expect(payingPassengers(list).map((x) => x.position)).toEqual([1, 2])
  })
  it("calcula el progreso", () => {
    expect(paymentProgress(list)).toEqual({ paidCount: 1, totalCount: 2, paidCents: 2000, pendingCents: 1500 })
  })
  it("sin pasajeros que paguen", () => {
    expect(paymentProgress([p(0, 1000)])).toEqual({ paidCount: 0, totalCount: 0, paidCents: 0, pendingCents: 0 })
  })
})
