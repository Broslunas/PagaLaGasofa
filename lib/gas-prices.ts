import type { RawStation } from "@/app/api/gasolineras/[id]/route";

// Fetch compartido por provincia — reusado por app/api/gasolineras/[id] y por
// el cron de precios, así una pasada del cron hace 1 llamada a MITECO por
// provincia (no una por favorito).
export async function fetchProvinceRawList(
  provinceId: string
): Promise<{ list: RawStation[]; updatedAt: string }> {
  const url = `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia/${provinceId}`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`MITECO respondió ${res.status} para provincia ${provinceId}`);
  const data = await res.json();
  return { list: data.ListaEESSPrecio || [], updatedAt: data.Fecha };
}
