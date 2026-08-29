// Self-check manual — sin framework. Correr con: node lib/brand-icon.check.ts
import assert from "node:assert/strict";
import { getBrandInitials, getBrandColor } from "./brand-icon.ts";

// Iniciales: dos palabras -> primera letra de cada una
assert.equal(getBrandInitials("Repsol"), "RE");
assert.equal(getBrandInitials("BP"), "BP");
assert.equal(getBrandInitials("Petronor Estaciones"), "PE");
assert.equal(getBrandInitials("  cepsa  "), "CE");
assert.equal(getBrandInitials(""), "?");

// Color: determinista y estable para la misma marca, case/espacios insensible
assert.equal(getBrandColor("Repsol"), getBrandColor("REPSOL"));
assert.equal(getBrandColor("  Repsol "), getBrandColor("Repsol"));
assert.notEqual(getBrandColor("Repsol"), getBrandColor("Cepsa"));

console.log("brand-icon.ts OK");
