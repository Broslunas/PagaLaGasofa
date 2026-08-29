// Self-check manual — sin framework. Correr con: node lib/opening-hours.check.ts
import assert from "node:assert/strict";
import { isOpenNow } from "./opening-hours.ts";

// Miércoles 2026-08-19, 10:00 (día=X)
const wed10 = new Date(2026, 7, 19, 10, 0);
// Miércoles 2026-08-19, 23:30
const wed2330 = new Date(2026, 7, 19, 23, 30);
// Domingo 2026-08-16, 03:00 (día=D)
const sun0300 = new Date(2026, 7, 16, 3, 0);
// Viernes 2026-08-21, 10:00 (día=V)
const fri10 = new Date(2026, 7, 21, 10, 0);

// 24H solo domingo -> abierto el domingo, cerrado el miércoles
assert.equal(isOpenNow("D: 24H", sun0300), true);
assert.equal(isOpenNow("D: 24H", wed10), false);

// Rango de días simple, dentro y fuera de horario
assert.equal(isOpenNow("L-V: 06:00-22:00; S-D: 07:00-22:00", wed10), true);
assert.equal(isOpenNow("L-V: 06:00-22:00; S-D: 07:00-22:00", wed2330), false);
// Fin de semana cae en el segundo segmento
assert.equal(isOpenNow("L-V: 06:00-22:00; S-D: 07:00-22:00", sun0300), false); // 03:00 fuera de 07-22

// Franja que cruza medianoche: 06:00-02:00
assert.equal(isOpenNow("L-V: 06:00-02:00", wed2330), true); // 23:30 >= 06:00
assert.equal(isOpenNow("L-V: 06:00-02:00", wed10), true); // 10:00 dentro del tramo normal
assert.equal(isOpenNow("L-V: 06:00-02:00", fri10), true);

// Múltiples franjas con " y "
assert.equal(isOpenNow("L-V: 07:00-15:00 y 17:00-22:00", wed10), true); // 10:00 en la primera
assert.equal(isOpenNow("L-V: 07:00-15:00 y 17:00-22:00", new Date(2026, 7, 19, 16, 0)), false); // hueco entre franjas

// Basura / vacío -> false, no crashea
assert.equal(isOpenNow(""), false);
assert.equal(isOpenNow("esto no es un horario", wed10), false);

console.log("opening-hours.ts OK");
