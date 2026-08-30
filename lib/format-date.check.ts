// Self-check manual — sin framework. Correr con: node lib/format-date.check.ts
import assert from "node:assert/strict";
import { formatMitecoDate } from "./format-date.ts";

// Instante fijo en verano (CEST, Madrid = UTC+2): 30/08/2026 10:00:00 Madrid -> 08:00:00 UTC.
const result = formatMitecoDate("30/08/2026 10:00:00");
const expectedUtcMs = Date.UTC(2026, 7, 30, 8, 0, 0);
const expected = new Date(expectedUtcMs).toLocaleString("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
assert.equal(result, expected);

// Formato inesperado -> se devuelve tal cual.
assert.equal(formatMitecoDate("no-es-una-fecha"), "no-es-una-fecha");

console.log("format-date.check.ts OK");
