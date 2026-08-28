"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, Fuel, Save } from "lucide-react";

const numberField = (v: string) => (v === "" ? 0 : Number(v));

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  avgConsumption: number;
  isDefault: boolean;
};
type Favorite = { stationId: string; name: string; brand: string; provinceId: string | null };

// Mismas keys que devuelve /api/gasolineras (GasStation.prices).
const FUEL_OPTIONS: { key: string; label: string }[] = [
  { key: "gasolina95", label: "Gasolina 95" },
  { key: "gasolina98", label: "Gasolina 98" },
  { key: "diesel", label: "Diésel" },
  { key: "dieselPremium", label: "Diésel Premium" },
  { key: "glp", label: "GLP" },
];

// Vehicle.fuelType es texto libre (sin enum en el resto de la app, ver
// vehicle-garage.tsx), así que esto es una heurística por substring, no un
// mapeo exacto — solo sirve para preseleccionar, el usuario puede corregirlo
// en el select de abajo.
function guessFuelKey(fuelType: string): string {
  const t = fuelType.toLowerCase();
  if (t.includes("98")) return "gasolina98";
  if (t.includes("diesel") || t.includes("diésel") || t.includes("gasóleo") || t.includes("gasoleo")) return "diesel";
  if (t.includes("glp") || t.includes("gas licuado")) return "glp";
  return "gasolina95";
}

const selectClass =
  "h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-card px-2.5 py-1 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-card";

export function StepVehicle({
  isRoundTrip,
  setIsRoundTrip,
  myVehicles,
  selectedVehicleId,
  selectVehicle,
  vehicleBrand,
  setVehicleBrand,
  vehicleModel,
  setVehicleModel,
  vehicleYear,
  setVehicleYear,
  aiLoading,
  aiError,
  estimateConsumption,
  consumptionL100,
  setConsumptionL100,
  fuelPricePerLiter,
  setFuelPricePerLiter,
  tollsCost,
  setTollsCost,
  extraCosts,
  setExtraCosts,
  myFavorites,
  applyFavoritePrice,
  favPriceLoading,
  favPriceError,
  isLoggedIn,
  saveVehicle,
  savingVehicle,
  saveVehicleError,
}: {
  isRoundTrip: boolean;
  setIsRoundTrip: (v: boolean) => void;
  myVehicles: Vehicle[];
  selectedVehicleId: string;
  selectVehicle: (id: string) => void;
  vehicleBrand: string;
  setVehicleBrand: (v: string) => void;
  vehicleModel: string;
  setVehicleModel: (v: string) => void;
  vehicleYear: string;
  setVehicleYear: (v: string) => void;
  aiLoading: boolean;
  aiError: string;
  estimateConsumption: () => void;
  consumptionL100: number;
  setConsumptionL100: (n: number) => void;
  fuelPricePerLiter: number;
  setFuelPricePerLiter: (n: number) => void;
  tollsCost: number;
  setTollsCost: (n: number) => void;
  extraCosts: number;
  setExtraCosts: (n: number) => void;
  myFavorites: Favorite[];
  applyFavoritePrice: (stationId: string, provinceId: string | null, fuelKey: string) => void;
  favPriceLoading: boolean;
  favPriceError: string;
  isLoggedIn: boolean;
  saveVehicle: () => void;
  savingVehicle: boolean;
  saveVehicleError: string;
}) {
  const [favStationId, setFavStationId] = useState("");
  const [favFuelKey, setFavFuelKey] = useState(FUEL_OPTIONS[0].key);
  const [showAiEstimate, setShowAiEstimate] = useState(false);

  // Al elegir/cambiar de vehículo, preseleccionar el combustible del picker
  // de favoritos según su fuelType real en vez del "gasolina95" fijo de antes.
  useEffect(() => {
    const vehicle = myVehicles.find((v) => v.id === selectedVehicleId);
    if (vehicle) setFavFuelKey(guessFuelKey(vehicle.fuelType));
  }, [selectedVehicleId, myVehicles]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col gap-4 overflow-y-auto">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={isRoundTrip} onCheckedChange={(v) => setIsRoundTrip(v === true)} />
        Ida y vuelta
      </label>

      {myVehicles.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="myVehicle">Mi vehículo</Label>
          <select
            id="myVehicle"
            className="h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-card px-2.5 py-1 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-card"
            value={selectedVehicleId}
            onChange={(e) => selectVehicle(e.target.value)}
          >
            {myVehicles.map((v) => (
              <option key={v.id} value={v.id} className="bg-card text-foreground">
                {v.brand} {v.model} ({v.year})
              </option>
            ))}
          </select>
        </div>
      )}

      {!showAiEstimate ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowAiEstimate(true)}>
          <Sparkles />
          Estimar consumo con IA (opcional)
        </Button>
      ) : (
        <div className="flex flex-col gap-1.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles size={14} className="text-primary" />
            Estimar consumo con IA (opcional)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Marca" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} />
            <Input placeholder="Modelo" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
            <Input placeholder="Año" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!vehicleBrand || !vehicleModel || aiLoading}
              onClick={estimateConsumption}
            >
              {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Estimar consumo
            </Button>
            {aiError && <span className="text-xs text-destructive">{aiError}</span>}
          </div>
          {isLoggedIn && vehicleBrand && vehicleModel && consumptionL100 > 0 && (
            <div className="flex items-center gap-2 border-t border-primary/20 pt-2">
              <Button type="button" variant="outline" size="sm" disabled={savingVehicle} onClick={saveVehicle}>
                {savingVehicle ? <Loader2 className="animate-spin" /> : <Save />}
                Guardar en mi garage
              </Button>
              {saveVehicleError && <span className="text-xs text-destructive">{saveVehicleError}</span>}
            </div>
          )}
        </div>
      )}

      {myFavorites.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border/40 p-3">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Fuel size={14} className="text-primary" />
            Precio desde gasolinera favorita
          </span>
          <div className="grid grid-cols-2 gap-2">
            <select className={selectClass} value={favStationId} onChange={(e) => setFavStationId(e.target.value)}>
              <option value="">Elige gasolinera</option>
              {myFavorites.map((f) => (
                <option key={f.stationId} value={f.stationId}>
                  {f.name}
                </option>
              ))}
            </select>
            <select className={selectClass} value={favFuelKey} onChange={(e) => setFavFuelKey(e.target.value)}>
              {FUEL_OPTIONS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!favStationId || favPriceLoading}
              onClick={() => {
                const station = myFavorites.find((f) => f.stationId === favStationId);
                if (station) applyFavoritePrice(station.stationId, station.provinceId, favFuelKey);
              }}
            >
              {favPriceLoading ? <Loader2 className="animate-spin" /> : <Fuel />}
              Usar precio actual
            </Button>
            {favPriceError && <span className="text-xs text-destructive">{favPriceError}</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="consumption">Consumo (L/100km)</Label>
          <Input
            id="consumption"
            type="number"
            min={0}
            step={0.1}
            value={consumptionL100}
            onChange={(e) => setConsumptionL100(numberField(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fuelPrice">Precio combustible (€/L)</Label>
          <Input
            id="fuelPrice"
            type="number"
            min={0}
            step={0.01}
            value={fuelPricePerLiter}
            onChange={(e) => setFuelPricePerLiter(numberField(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tolls">Peajes (€)</Label>
          <Input
            id="tolls"
            type="number"
            min={0}
            step={0.01}
            value={tollsCost}
            onChange={(e) => setTollsCost(numberField(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="extras">Otros gastos (€)</Label>
          <Input
            id="extras"
            type="number"
            min={0}
            step={0.01}
            value={extraCosts}
            onChange={(e) => setExtraCosts(numberField(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
