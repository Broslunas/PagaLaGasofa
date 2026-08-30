import { NextResponse } from "next/server";
import { fetchProvinceRawList } from "@/lib/gas-prices";
import { prisma } from "@/lib/prisma";

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
  "Margen": string;
  "Tipo Venta": string;
  "Remisión": string;
  "Precio Gasoleo A": string;
  "Precio Gasoleo Premium": string;
  "Precio Gasoleo B": string;
  "Precio Gasolina 95 E5": string;
  "Precio Gasolina 95 E5 Premium": string;
  "Precio Gasolina 98 E5": string;
  "Precio Gases licuados del petróleo": string;
  "Precio Diésel Renovable": string;
  "Precio Gas Natural Comprimido": string;
  "Precio Gas Natural Licuado": string;
  "Precio Adblue": string;
  "Precio Bioetanol": string;
  "Precio Biodiesel": string;
  "Precio Hidrogeno": string;
}

export interface GasStationDetail {
  id: string;
  name: string;
  brand: string;
  address: string;
  postalCode: string;
  city: string;
  municipality: string;
  province: string;
  provinceId: string;
  schedule: string;
  margin: string;
  saleType: string;
  remission: string;
  lat: number;
  lng: number;
  prices: {
    gasolina95: number | null;
    gasolina95Premium: number | null;
    gasolina98: number | null;
    diesel: number | null;
    dieselPremium: number | null;
    dieselB: number | null;
    glp: number | null;
    gnc: number | null;
    gnl: number | null;
    adblue: number | null;
    bioetanol: number | null;
    biodiesel: number | null;
    hidrogeno: number | null;
    dieselRenovable: number | null;
  };
}

function parseSpanishFloat(val: string): number | null {
  if (!val) return null;
  const num = parseFloat(val.replace(",", "."));
  return isNaN(num) || num <= 0 ? null : num;
}

export function transformRawStation(item: RawStation): GasStationDetail {
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
    provinceId: item["IDProvincia"],
    schedule: item["Horario"],
    margin: item["Margen"] || "N/A",
    saleType: item["Tipo Venta"] === "P" ? "Público" : item["Tipo Venta"] || "Público",
    remission: item["Remisión"] || "",
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    prices: {
      gasolina95: parseSpanishFloat(item["Precio Gasolina 95 E5"]),
      gasolina95Premium: parseSpanishFloat(item["Precio Gasolina 95 E5 Premium"]),
      gasolina98: parseSpanishFloat(item["Precio Gasolina 98 E5"]),
      diesel: parseSpanishFloat(item["Precio Gasoleo A"]),
      dieselPremium: parseSpanishFloat(item["Precio Gasoleo Premium"]),
      dieselB: parseSpanishFloat(item["Precio Gasoleo B"]),
      glp: parseSpanishFloat(item["Precio Gases licuados del petróleo"]),
      gnc: parseSpanishFloat(item["Precio Gas Natural Comprimido"]),
      gnl: parseSpanishFloat(item["Precio Gas Natural Licuado"]),
      adblue: parseSpanishFloat(item["Precio Adblue"]),
      bioetanol: parseSpanishFloat(item["Precio Bioetanol"]),
      biodiesel: parseSpanishFloat(item["Precio Biodiesel"]),
      hidrogeno: parseSpanishFloat(item["Precio Hidrogeno"]),
      dieselRenovable: parseSpanishFloat(item["Precio Diésel Renovable"]),
    },
  };
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const stationId = params.id;
  const { searchParams } = new URL(request.url);
  // Provincia por query param (viene de los links del listado) o, si falta,
  // la que ya tengamos cacheada en StationInfo — evita el fallback nacional
  // completo (~12k estaciones) para saber a qué provincia preguntarle a MITECO.
  let provinceId = searchParams.get("provincia");
  if (!provinceId) {
    const cached = await prisma.stationInfo.findUnique({
      where: { stationId },
      select: { provinceId: true },
    });
    provinceId = cached?.provinceId ?? null;
  }

  try {
    let rawList: RawStation[];
    let updatedAt: string | undefined;
    if (provinceId) {
      ({ list: rawList, updatedAt } = await fetchProvinceRawList(provinceId));
    } else {
      const res = await fetch(
        "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/",
        { next: { revalidate: 1800 } }
      );
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch station from MITECO" }, { status: 502 });
      }
      const data = await res.json();
      rawList = data.ListaEESSPrecio || [];
      updatedAt = data.Fecha;
    }

    const raw = rawList.find((item) => item.IDEESS === stationId);
    if (!raw) {
      return NextResponse.json({ error: "Gasolinera no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      updatedAt,
      station: transformRawStation(raw),
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
