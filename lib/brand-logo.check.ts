// Self-check manual — sin framework. Correr con: node lib/brand-logo.check.ts
import assert from "node:assert/strict";
import { getBrandLogoUrl } from "./brand-logo.ts";

// Marca grande mapeada -> ruta al asset estático
assert.equal(getBrandLogoUrl("Repsol"), "/brands/repsol.svg");
// Case/espacios insensible
assert.equal(getBrandLogoUrl("  cepsa "), getBrandLogoUrl("CEPSA"));
// Marca pequeña/no mapeada -> null (fallback a iniciales en brand-avatar.tsx)
assert.equal(getBrandLogoUrl("Océano Taco"), null);
assert.equal(getBrandLogoUrl(""), null);

// Marca + nombre propio de la instalación -> matchea por la primera palabra
assert.equal(getBrandLogoUrl("DISA MAYORAZGO"), "/brands/disa.png");
assert.equal(getBrandLogoUrl("BP TACO NORTE"), "/brands/bp.svg");
assert.equal(getBrandLogoUrl("REPSOL BUTANO"), "/brands/repsol.svg");

console.log("brand-logo.ts OK");
