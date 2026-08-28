export const PROVINCES = [
  { id: "01", name: "Álava" },
  { id: "02", name: "Albacete" },
  { id: "03", name: "Alicante" },
  { id: "04", name: "Almería" },
  { id: "33", name: "Asturias" },
  { id: "05", name: "Ávila" },
  { id: "06", name: "Badajoz" },
  { id: "07", name: "Baleares" },
  { id: "08", name: "Barcelona" },
  { id: "09", name: "Burgos" },
  { id: "10", name: "Cáceres" },
  { id: "11", name: "Cádiz" },
  { id: "39", name: "Cantabria" },
  { id: "12", name: "Castellón" },
  { id: "51", name: "Ceuta" },
  { id: "13", name: "Ciudad Real" },
  { id: "14", name: "Córdoba" },
  { id: "15", name: "A Coruña" },
  { id: "16", name: "Cuenca" },
  { id: "17", name: "Girona" },
  { id: "18", name: "Granada" },
  { id: "19", name: "Guadalajara" },
  { id: "20", name: "Gipuzkoa" },
  { id: "21", name: "Huelva" },
  { id: "22", name: "Huesca" },
  { id: "23", name: "Jaén" },
  { id: "24", name: "León" },
  { id: "25", name: "Lleida" },
  { id: "27", name: "Lugo" },
  { id: "28", name: "Madrid" },
  { id: "29", name: "Málaga" },
  { id: "52", name: "Melilla" },
  { id: "30", name: "Murcia" },
  { id: "31", name: "Navarra" },
  { id: "32", name: "Ourense" },
  { id: "34", name: "Palencia" },
  { id: "35", name: "Las Palmas" },
  { id: "36", name: "Pontevedra" },
  { id: "26", name: "La Rioja" },
  { id: "37", name: "Salamanca" },
  { id: "38", name: "Santa Cruz de Tenerife" },
  { id: "40", name: "Segovia" },
  { id: "41", name: "Sevilla" },
  { id: "42", name: "Soria" },
  { id: "43", name: "Tarragona" },
  { id: "44", name: "Teruel" },
  { id: "45", name: "Toledo" },
  { id: "46", name: "Valencia" },
  { id: "47", name: "Valladolid" },
  { id: "48", name: "Bizkaia" },
  { id: "49", name: "Zamora" },
  { id: "50", name: "Zaragoza" }
];

export const PROVINCE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "01": { lat: 42.8468, lng: -2.6716 }, // Álava
  "02": { lat: 38.9943, lng: -1.8585 }, // Albacete
  "03": { lat: 38.3452, lng: -0.4810 }, // Alicante
  "04": { lat: 36.8340, lng: -2.4637 }, // Almería
  "33": { lat: 43.3619, lng: -5.8494 }, // Asturias
  "05": { lat: 40.6565, lng: -4.6818 }, // Ávila
  "06": { lat: 38.8794, lng: -6.9707 }, // Badajoz
  "07": { lat: 39.5696, lng: 2.6502 },  // Baleares
  "08": { lat: 41.3879, lng: 2.1699 },  // Barcelona
  "09": { lat: 42.3440, lng: -3.6969 }, // Burgos
  "10": { lat: 39.4753, lng: -6.3722 }, // Cáceres
  "11": { lat: 36.5271, lng: -6.2886 }, // Cádiz
  "39": { lat: 43.4623, lng: -3.8099 }, // Cantabria
  "12": { lat: 39.9864, lng: -0.0513 }, // Castellón
  "51": { lat: 35.8894, lng: -5.3213 }, // Ceuta
  "13": { lat: 38.9863, lng: -3.9274 }, // Ciudad Real
  "14": { lat: 37.8882, lng: -4.7794 }, // Córdoba
  "15": { lat: 43.3623, lng: -8.4115 }, // A Coruña
  "16": { lat: 40.0704, lng: -2.1374 }, // Cuenca
  "17": { lat: 41.9794, lng: 2.8214 },  // Girona
  "18": { lat: 37.1773, lng: -3.5986 }, // Granada
  "19": { lat: 40.6337, lng: -3.1674 }, // Guadalajara
  "20": { lat: 43.3183, lng: -1.9812 }, // Gipuzkoa
  "21": { lat: 37.2614, lng: -6.9447 }, // Huelva
  "22": { lat: 42.1362, lng: -0.4087 }, // Huesca
  "23": { lat: 37.7796, lng: -3.7849 }, // Jaén
  "24": { lat: 42.5987, lng: -5.5671 }, // León
  "25": { lat: 41.6176, lng: 0.6200 },  // Lleida
  "27": { lat: 43.0097, lng: -7.5568 }, // Lugo
  "28": { lat: 40.4168, lng: -3.7038 }, // Madrid
  "29": { lat: 36.7213, lng: -4.4214 }, // Málaga
  "52": { lat: 35.2923, lng: -2.9381 }, // Melilla
  "30": { lat: 37.9922, lng: -1.1307 }, // Murcia
  "31": { lat: 42.8125, lng: -1.6458 }, // Navarra
  "32": { lat: 42.3358, lng: -7.8639 }, // Ourense
  "34": { lat: 42.0096, lng: -4.5288 }, // Palencia
  "35": { lat: 28.1235, lng: -15.4363 }, // Las Palmas
  "36": { lat: 42.4310, lng: -8.6444 }, // Pontevedra
  "26": { lat: 42.4658, lng: -2.4499 }, // La Rioja
  "37": { lat: 40.9701, lng: -5.6635 }, // Salamanca
  "38": { lat: 28.4636, lng: -16.2518 }, // Santa Cruz de Tenerife
  "40": { lat: 40.9429, lng: -4.1088 }, // Segovia
  "41": { lat: 37.3891, lng: -5.9845 }, // Sevilla
  "42": { lat: 41.7636, lng: -2.4649 }, // Soria
  "43": { lat: 41.1189, lng: 1.2445 },  // Tarragona
  "44": { lat: 40.3456, lng: -1.1072 }, // Teruel
  "45": { lat: 39.8628, lng: -4.0273 }, // Toledo
  "46": { lat: 39.4699, lng: -0.3763 }, // Valencia
  "47": { lat: 41.6523, lng: -4.7245 }, // Valladolid
  "48": { lat: 43.2630, lng: -2.9350 }, // Bizkaia
  "49": { lat: 41.5063, lng: -5.7446 }, // Zamora
  "50": { lat: 41.6488, lng: -0.8891 }  // Zaragoza
};

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findClosestProvince(userLat: number, userLng: number): string {
  let closestId = "28";
  let minDistance = Infinity;

  for (const [id, coords] of Object.entries(PROVINCE_COORDINATES)) {
    const dist = getDistanceKm(userLat, userLng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestId = id;
    }
  }

  return closestId;
}

export const FUEL_TYPES = [
  { id: "gasolina95", label: "Gasolina 95", short: "95" },
  { id: "gasolina98", label: "Gasolina 98", short: "98" },
  { id: "diesel", label: "Diésel / Gasóleo A", short: "Diésel" },
  { id: "dieselPremium", label: "Diésel Premium", short: "D. Plus" },
  { id: "glp", label: "GLP (Autogas)", short: "GLP" },
] as const;
