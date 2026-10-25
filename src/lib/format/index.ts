const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })
const number1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 })
const number2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatCents = (cents: number) => euros.format(cents / 100)
export const formatNumber = (n: number) => number1.format(n)
export const formatDecimal2 = (n: number) => number2.format(n)

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h === 0 ? `${m} min` : `${h} h ${m.toString().padStart(2, "0")} min`
}

/** Admite coma o punto decimal; devuelve NaN si el texto no es un número. */
export function parseDecimal(text: string): number {
  const clean = text.trim().replace(",", ".")
  if (clean === "" || !/^-?\d*\.?\d*$/.test(clean)) return NaN
  return Number(clean)
}
