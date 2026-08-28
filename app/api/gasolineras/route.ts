import { NextResponse } from "next/server";

export const revalidate = 1800; // cache 30 mins

export interface RawStation {
  "C.P.": string;
  "Dirección": string;
  "Horario": string;
  "Latitud": string;
  "Localidad": string;
  "Longitud (WGS84)": string;
  "Municipio": string;
  "Provincia": string;
  "Rótulo": string;
  "IDEESS": string;
  "IDMunicipio": string;
  "IDProvincia": string;
  "Precio Gasoleo A": string;
  "Precio Gasoleo Premium": string;
  "Precio Gasolina 95 E5": string;
  "Precio Gasolina 98 E5": string;
  "Precio Gases licuados del petróleo": string;
  "Precio Diésel Renovable": string;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get("provincia") || "28"; // Default Madrid
  const fuelType = searchParams.get("fuel") || "gasolina95"; // gasolina95, gasolina98, diesel, dieselPremium, glp

  try {
    const res = await fetch(
      `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia/${provinceId}`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch data from MITECO" }, { status: 502 });
    }

    const data = await res.json();
    const rawList: RawStation[] = data.ListaEESSPrecio || [];

    const stations: GasStation[] = rawList.map((item) => {
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
    });

    // Sort by selected fuel price ascending (nulls last)
    stations.sort((a, b) => {
      const pA = a.prices[fuelType as keyof typeof a.prices] ?? Infinity;
      const pB = b.prices[fuelType as keyof typeof b.prices] ?? Infinity;
      return pA - pB;
    });

    return NextResponse.json({
      updatedAt: data.Fecha,
      total: stations.length,
      stations,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
