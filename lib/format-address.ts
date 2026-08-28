export function shortenAddress(address: string): string {
  if (!address) return "";
  // Si tiene comas, tomamos la primera parte significativa o las dos primeras
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return address;
  if (parts.length === 1) return parts[0];
  // Si la primera es un número o calle y la segunda es ciudad, unimos las 2 primeras
  return `${parts[0]}, ${parts[1]}`;
}
