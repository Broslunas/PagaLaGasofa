/** Aritmética en céntimos enteros: evita errores de coma flotante en los repartos. */

/** Redondea a céntimos corrigiendo el ruido binario (1,005 * 100 = 100,49999…). */
export const toCents = (euros: number) => Math.round(Number((euros * 100).toPrecision(12)))
export const fromCents = (cents: number) => cents / 100

/**
 * Reparte `totalCents` proporcionalmente a `weights` con el método del mayor
 * resto: la suma del resultado es siempre exactamente `totalCents`.
 * Si todos los pesos son 0 no se puede repartir y devuelve ceros.
 */
export function allocateCents(totalCents: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (weights.length === 0 || sum <= 0) return weights.map(() => 0)

  const exact = weights.map((w) => (totalCents * w) / sum)
  const base = exact.map(Math.floor)
  let missing = totalCents - base.reduce((a, b) => a + b, 0)

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .filter(({ index }) => weights[index] > 0)
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)

  for (let i = 0; missing > 0 && byRemainder.length > 0; i = (i + 1) % byRemainder.length) {
    base[byRemainder[i].index] += 1
    missing -= 1
  }
  return base
}
