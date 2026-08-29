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

export interface GasStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  postalCode: string;
  city: string;
  municipality: string;
  province: string;
  schedule: string;
  lat: number;
  lng: number;
  prices: {
    gasolina95: number | null;
    gasolina98: number | null;
    diesel: number | null;
    dieselPremium: number | null;
    glp: number | null;
  };
}

function parseSpanishFloat(val: string): number | null {
  if (!val) return null;
  const num = parseFloat(val.replace(",", "."));
  return isNaN(num) || num <= 0 ? null : num;
}

// Mapeo RawStation (MITECO) -> GasStation, compartido por app/api/gasolineras
// y app/api/gasolineras/en-ruta para no duplicar el parseo.
export function rawStationToGasStation(item: RawStation): GasStation {
  const lat = parseFloat((item["Latitud"] || "").replace(",", "."));
  const lng = parseFloat((item["Longitud (WGS84)"] || "").replace(",", "."));

  return {
    id: item["IDEESS"],
    name: item["Rótulo"] || "Gasolinera",
    brand: item["Rótulo"]?.trim() || "Genérica",
    address: item["Dirección"],
    postalCode: item["C.P."],
    city: item["Localidad"],
    municipality: item["Municipio"],
    province: item["Provincia"],
    schedule: item["Horario"],
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    prices: {
      gasolina95: parseSpanishFloat(item["Precio Gasolina 95 E5"]),
      gasolina98: parseSpanishFloat(item["Precio Gasolina 98 E5"]),
      diesel: parseSpanishFloat(item["Precio Gasoleo A"]),
      dieselPremium: parseSpanishFloat(item["Precio Gasoleo Premium"]),
      glp: parseSpanishFloat(item["Precio Gases licuados del petróleo"]),
    },
  };
}
