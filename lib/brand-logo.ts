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
};

export function getBrandLogoUrl(brand: string): string | null {
  const normalized = brand.trim().toUpperCase();
  if (BRAND_LOGO_FILES[normalized]) return `/brands/${BRAND_LOGO_FILES[normalized]}`;
  // Muchas estaciones llevan la marca + nombre propio de la instalación, p.ej.
  // "DISA MAYORAZGO", "BP TACO NORTE", "REPSOL BUTANO" — la primera palabra
  // ya identifica la marca real, así que también vale como match.
  const firstWord = normalized.split(/\s+/)[0];
  const file = BRAND_LOGO_FILES[firstWord];
  return file ? `/brands/${file}` : null;
}
