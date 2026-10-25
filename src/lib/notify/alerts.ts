// Reglas de las alertas de precio de gasolineras favoritas. Lógica pura.
//
// - Con umbral: se avisa cuando el precio cruza el umbral hacia abajo (estaba por encima y ahora está igual o por debajo).
// - Sin umbral: se avisa de cualquier bajada de al menos 1 céntimo respecto a la última comprobación.
// - Las subidas nunca avisan, pero actualizan la referencia para detectar la próxima bajada.

export const MIN_DROP = 0.01

export interface AlertInput {
  current: number | null
  lastSeen: number | null
  threshold: number | null
}

export interface AlertDecision {
  notify: boolean
  reason?: "threshold" | "drop"
  /** Valor que se guarda como «último precio comprobado». */
  nextSeen: number | null
}

// Los precios llevan tres decimales; se comparan en milésimas enteras para evitar errores de coma flotante.
const milli = (n: number) => Math.round(n * 1000)

export function evaluateAlert({ current, lastSeen, threshold }: AlertInput): AlertDecision {
  if (current === null) return { notify: false, nextSeen: lastSeen }
  if (lastSeen === null) return { notify: false, nextSeen: current } // primera lectura: solo fija la referencia

  const cur = milli(current)
  const prev = milli(lastSeen)

  if (threshold !== null) {
    const limit = milli(threshold)
    if (cur <= limit && prev > limit) return { notify: true, reason: "threshold", nextSeen: current }
    return { notify: false, nextSeen: current }
  }
  if (prev - cur >= milli(MIN_DROP)) return { notify: true, reason: "drop", nextSeen: current }
  return { notify: false, nextSeen: current }
}
