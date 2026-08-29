// Self-check manual — sin framework. Correr con: node lib/brand-logo.check.ts
import assert from "node:assert/strict";
import { getBrandLogoUrl } from "./brand-logo.ts";

// Marca grande mapeada -> ruta al asset estático
assert.equal(getBrandLogoUrl("Repsol"), "/brands/repsol.svg");
assert.equal(getBrandLogoUrl("  cepsa "), getBrandLogoUrl("CEPSA"));

// Marca + nombre propio de la instalación -> matchea por la primera palabra
assert.equal(getBrandLogoUrl("DISA MAYORAZGO"), "/brands/disa.png");
assert.equal(getBrandLogoUrl("BP TACO NORTE"), "/brands/bp.svg");
assert.equal(getBrandLogoUrl("REPSOL BUTANO"), "/brands/repsol.svg");

// Marcas canarias pedidas por el usuario
assert.equal(getBrandLogoUrl("TGAS LA HIDALGA"), "/brands/tgas.png");
assert.equal(getBrandLogoUrl("TGAS-TU TRÉBOL"), "/brands/tgas.png");
assert.equal(getBrandLogoUrl("TGAS-TU TREBOL"), "/brands/tgas.png");
assert.equal(getBrandLogoUrl("PCAN"), "/brands/pcan.png");
assert.equal(getBrandLogoUrl("OCÉANO TACO"), "/brands/oceano.png");
assert.equal(getBrandLogoUrl("EESS OCÉANO LA AZADILLA"), "/brands/oceano.png");
assert.equal(getBrandLogoUrl("E.S. OCÉANO SANTA CRUZ"), "/brands/oceano.png");
assert.equal(getBrandLogoUrl("CANARY OIL, S.L."), "/brands/canary.webp");
assert.equal(getBrandLogoUrl("GMOIL"), "/brands/gmoil.png");
assert.equal(getBrandLogoUrl("H2EXAGON"), "/brands/h2exagon.png");
assert.equal(getBrandLogoUrl("H2GO"), "/brands/h2exagon.png");

// Ronda nacional adicional (baja frecuencia pero marcas reales identificables)
assert.equal(getBrandLogoUrl("ASC CARBURANTES"), "/brands/asc.svg");
assert.equal(getBrandLogoUrl("FAMILY ENERGY"), "/brands/familyenergy.png");
assert.equal(getBrandLogoUrl("FARRUCO S.A."), "/brands/farruco.png");
assert.equal(getBrandLogoUrl("E.LECLERC LEON"), "/brands/leclerc.svg");
assert.equal(getBrandLogoUrl("E-LECLERC"), "/brands/leclerc.svg");
assert.equal(getBrandLogoUrl("LUKOIL"), "/brands/lukoil.svg");
assert.equal(getBrandLogoUrl("COSTCO"), "/brands/costco.svg");

// Marca pequeña/no mapeada -> null (fallback a iniciales en brand-avatar.tsx)
assert.equal(getBrandLogoUrl("Estación de Servicio El Cruce Desconocido"), null);
assert.equal(getBrandLogoUrl(""), null);

console.log("brand-logo.ts OK");
