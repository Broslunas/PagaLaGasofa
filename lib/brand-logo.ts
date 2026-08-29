// Logos reales de las marcas de carburante más comunes en España, servidos
// como assets estáticos desde public/brands/ (mismo logo para todos los
// usuarios, sin BD ni fetch extra). El resto de "Rótulo" del dataset MITECO
// son operadores pequeños/independientes (miles de valores distintos) sin
// logo — para esos getBrandLogoUrl devuelve null y se cae al avatar de
// iniciales (ver brand-icon.ts + brand-avatar.tsx).
// Para añadir una marca nueva: guarda el archivo en public/brands/ y añade
// una entrada aquí con la clave en MAYÚSCULAS igual al Rótulo de MITECO.
const BRAND_LOGO_FILES: Record<string, string> = {
  REPSOL: "repsol.svg",
  MOEVE: "moeve.svg",
  CEPSA: "cepsa.svg",
  GALP: "galp.svg",
  BALLENOIL: "ballenoil.svg",
  PLENERGY: "plenergy.png",
  SHELL: "shell.svg",
  PETROPRIX: "petroprix.svg",
  PETRONOR: "petronor.png",
  BP: "bp.svg",
  CARREFOUR: "carrefour.svg",
  AVIA: "avia.svg",
  Q8: "q8.svg",
  BONAREA: "bonarea.png",
  CAMPSA: "campsa.jpg",
  VALCARCE: "valcarce.svg",
  AGLA: "agla.svg",
  ALCAMPO: "alcampo.png",
  ENI: "eni.svg",
  EROSKI: "eroski.svg",
  MEROIL: "meroil.png",
  BEROIL: "beroil.png",
  DISA: "disa.png",
  TAMOIL: "tamoil.png",
  MOLGAS: "molgas.png",
  NATURGY: "naturgy.png",
  ESCLATOIL: "esclatoil.png",
  // Canarias / Tenerife
  TGAS: "tgas.png",
  PCAN: "pcan.png",
  "OCÉANO": "oceano.png",
  OCEANO: "oceano.png",
  CANARY: "canary.webp",
  GMOIL: "gmoil.png",
  "GM OIL": "gmoil.png",
  GM: "gmoil.png",
  H2EXAGON: "h2exagon.png",
  H2GO: "h2exagon.png",
  // Nacionales adicionales
  GASEXPRESS: "gasexpress.svg",
  HAM: "ham.png",
  PETROCAT: "petrocat.jpg",
  AUTONETOIL: "autonetoil.svg",
  IBERDOEX: "iberdoex.svg",
  "LOW COST": "lowcost.png",
  LOW: "lowcost.png",
};

export function getBrandLogoUrl(brand: string): string | null {
  const normalized = brand.trim().toUpperCase();
  if (BRAND_LOGO_FILES[normalized]) return `/brands/${BRAND_LOGO_FILES[normalized]}`;

  // Elimina prefijos comunes de instalación ("E.S.", "E.S", "EESS", "E.E.S.S.", "ESTACION DE SERVICIO", etc.)
  const stripped = normalized
    .replace(/^(E\.?\s*E\.?\s*S\.?\s*S\.?|E\.?\s*S\.?)\s+/i, "")
    .replace(/^ESTACI[OÓ]N\s+(DE\s+SERVICIO\s+)?/i, "")
    .trim();
  if (BRAND_LOGO_FILES[stripped]) return `/brands/${BRAND_LOGO_FILES[stripped]}`;

  // Match por primera palabra del nombre ya limpio ("DISA MAYORAZGO" -> "DISA",
  // "E.S. OCÉANO SANTA CRUZ" -> "OCÉANO", "TGAS-TU TRÉBOL" -> "TGAS")
  // Separador: espacios o guiones.
  const firstWord = stripped.split(/[\s\-]+/)[0];
  const file = BRAND_LOGO_FILES[firstWord];
  return file ? `/brands/${file}` : null;
}
