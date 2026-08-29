import { NextResponse } from "next/server";
import { rawStationToGasStation, type GasStation } from "@/lib/gas-prices";
import type { RawStation } from "@/app/api/gasolineras/[id]/route";

export const revalidate = 1800; // cache 30 mins

export type { GasStation };

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
    const stations: GasStation[] = rawList.map(rawStationToGasStation);

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
