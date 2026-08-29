// Avatar visual para identificar gasolineras por marca sin depender de logos
// reales: el campo "brand" viene libre del dataset del Gobierno (Rótulo),
// con cientos de valores distintos y muchos genéricos/locales que nunca
// tendrían un logo. Iniciales + color determinista por marca = gratis, sin
// red, sin assets que mantener.
// ponytail: si se consiguen logos reales de las marcas grandes (Repsol,
// Cepsa, BP...), añadir un mapa slug->ruta en public/brands/ y comprobarlo
// antes del fallback de iniciales — normalizeBrand ya da la clave a usar.

const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899",
];

export function normalizeBrand(brand: string): string {
  return brand.trim().toUpperCase();
}

export function getBrandInitials(brand: string): string {
  const words = normalizeBrand(brand).split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

export function getBrandColor(brand: string): string {
  const key = normalizeBrand(brand);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
