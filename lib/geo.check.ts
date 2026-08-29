// Self-check manual — sin framework. Correr con: node lib/geo.check.ts
import assert from "node:assert/strict";
import { distanceToPolylineKm, provincesAlongPolyline } from "./geo.ts";

// Segmento norte-sur en el ecuador (mismo lng): punto en (0, 0.5) desviado
// 0.1 grados de lng ~ 11.1km a esa latitud.
const line: [number, number][] = [
  [0, 0],
  [1, 0],
];
const d = distanceToPolylineKm({ lat: 0.5, lng: 0.1 }, line);
assert.ok(Math.abs(d - 11.1) < 0.5, `esperaba ~11.1km, dio ${d}`);

// Punto sobre la propia línea -> distancia ~0.
assert.ok(distanceToPolylineKm({ lat: 0.5, lng: 0 }, line) < 0.01);

// Punto más allá del extremo -> distancia al extremo (no a la recta infinita).
const dEnd = distanceToPolylineKm({ lat: 2, lng: 0 }, line);
assert.ok(Math.abs(dEnd - 111.19) < 1, `esperaba ~111km (a (1,0)), dio ${dEnd}`);

// Ruta Madrid -> Valencia (aprox): debe incluir Madrid (28) y Valencia (46).
const madridValencia: [number, number][] = [
  [40.4168, -3.7038],
  [39.9, -2.5],
  [39.6, -1.0],
  [39.4699, -0.3763],
];
const provinces = provincesAlongPolyline(madridValencia);
assert.ok(provinces.includes("28"), "debería incluir Madrid");
assert.ok(provinces.includes("46"), "debería incluir Valencia");

console.log("geo.check.ts OK");
