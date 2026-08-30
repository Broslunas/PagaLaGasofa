// MITECO devuelve "Fecha" como "dd/mm/yyyy HH:mm:ss" en hora de España (Europe/Madrid).
// Esto la reinterpreta en la zona horaria del navegador para mostrarla correcta.
export function formatMitecoDate(fecha: string): string {
  const match = fecha.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (!match) return fecha; // formato inesperado -> devolver tal cual

  const [, day, month, year, hour, minute, second] = match.map(Number) as unknown as number[];
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);

  // Offset de Madrid (CET/CEST) en el instante aproximado.
  const offsetPart = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date(guessUtcMs))
    .find((p) => p.type === "timeZoneName")?.value;
  const offsetMatch = offsetPart?.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? Number(offsetMatch[1]) : 1; // fallback CET

  const realUtcMs = guessUtcMs - offsetHours * 3_600_000;

  return new Date(realUtcMs).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
