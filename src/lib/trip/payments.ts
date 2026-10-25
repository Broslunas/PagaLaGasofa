// Lógica pura de cobros, sin acceso a datos ni a cookies.

interface PassengerLike {
  position: number
  amountCents: number
  hasPaid: boolean
}

/** Pasajeros que tienen que pagar algo (no el conductor ni los de 0 €). */
export const payingPassengers = <T extends PassengerLike>(passengers: T[]) =>
  passengers.filter((p) => p.position > 0 && p.amountCents > 0)

export function paymentProgress<T extends PassengerLike>(passengers: T[]) {
  const paying = payingPassengers(passengers)
  const paid = paying.filter((p) => p.hasPaid)
  return {
    paidCount: paid.length,
    totalCount: paying.length,
    paidCents: paid.reduce((s, p) => s + p.amountCents, 0),
    pendingCents: paying.filter((p) => !p.hasPaid).reduce((s, p) => s + p.amountCents, 0),
  }
}
