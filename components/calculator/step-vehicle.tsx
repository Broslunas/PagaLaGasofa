"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles } from "lucide-react";

const numberField = (v: string) => (v === "" ? 0 : Number(v));

type Vehicle = { id: string; brand: string; model: string; year: number; avgConsumption: number; isDefault: boolean };

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
}) {
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
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            value={selectedVehicleId}
            onChange={(e) => selectVehicle(e.target.value)}
          >
            {myVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} ({v.year})
              </option>
            ))}
          </select>
        </div>
      )}

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
      </div>

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
