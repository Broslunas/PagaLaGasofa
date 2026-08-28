"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateTrip } from "@/lib/calculator";
import { LocationField, type GeoPoint } from "@/components/calculator/location-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Route, Sparkles, Plus, X, Receipt } from "lucide-react";

const numberField = (v: string) => (v === "" ? 0 : Number(v));

export function Calculator() {
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState("");

  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [consumptionL100, setConsumptionL100] = useState(6);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(1.5);
  const [tollsCost, setTollsCost] = useState(0);
  const [extraCosts, setExtraCosts] = useState(0);
  const [passengerNames, setPassengerNames] = useState<string[]>([""]);

  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const router = useRouter();

  function addPassenger() {
    setPassengerNames((names) => [...names, ""]);
  }
  function removePassenger(i: number) {
    setPassengerNames((names) => names.filter((_, idx) => idx !== i));
  }
  function renamePassenger(i: number, name: string) {
    setPassengerNames((names) => names.map((n, idx) => (idx === i ? name : n)));
  }

  async function generateTicket() {
    setTicketLoading(true);
    setTicketError("");
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: origin?.label ?? "",
          destination: destination?.label ?? "",
          distanceKm,
          isRoundTrip,
          consumptionL100,
          fuelPricePerLiter,
          tollsCost,
          extraCosts,
          passengerNames,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar el ticket");
      router.push(`/t/${data.shareId}`);
    } catch (e) {
      setTicketError(e instanceof Error ? e.message : "Error al generar el ticket");
      setTicketLoading(false);
    }
  }

  async function estimateConsumption() {
    if (!vehicleBrand || !vehicleModel) return;
    setAiLoading(true);
    setAiError("");
    try {
      const url = `/api/vehicle-consumption?brand=${encodeURIComponent(vehicleBrand)}&model=${encodeURIComponent(vehicleModel)}&year=${encodeURIComponent(vehicleYear)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al estimar el consumo");
      setConsumptionL100(data.consumptionL100);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Error al estimar el consumo");
    } finally {
      setAiLoading(false);
    }
  }

  async function fetchDistance() {
    if (!origin || !destination) return;
    setDistanceLoading(true);
    setDistanceError("");
    try {
      const url = `/api/distance?originLat=${origin.lat}&originLon=${origin.lon}&destLat=${destination.lat}&destLon=${destination.lon}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al calcular la distancia");
      setDistanceKm(data.distanceKm);
    } catch (e) {
      setDistanceError(e instanceof Error ? e.message : "Error al calcular la distancia");
    } finally {
      setDistanceLoading(false);
    }
  }

  const result = calculateTrip({
    distanceKm,
    isRoundTrip,
    consumptionL100,
    fuelPricePerLiter,
    tollsCost,
    extraCosts,
    passengersCount: passengerNames.length,
  });

  return (
    <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de viaje</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LocationField id="origin" label="Origen" value={origin} onChange={setOrigin} />
          <LocationField id="destination" label="Destino" value={destination} onChange={setDestination} />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!origin || !destination || distanceLoading}
              onClick={fetchDistance}
            >
              {distanceLoading ? <Loader2 className="animate-spin" /> : <Route />}
              Calcular distancia
            </Button>
            {distanceError && <span className="text-xs text-destructive">{distanceError}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="distanceKm">Distancia (km)</Label>
            <Input
              id="distanceKm"
              type="number"
              min={0}
              value={distanceKm}
              onChange={(e) => setDistanceKm(numberField(e.target.value))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isRoundTrip} onCheckedChange={(v) => setIsRoundTrip(v === true)} />
            Ida y vuelta
          </label>

          <div className="flex flex-col gap-1.5 rounded-lg border p-3">
            <span className="text-sm font-medium">Estimar consumo con IA (opcional)</span>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Marca"
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
              />
              <Input
                placeholder="Modelo"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
              <Input
                placeholder="Año"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
              />
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

          <div className="flex flex-col gap-1.5">
            <Label>Pasajeros</Label>
            {passengerNames.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={i === 0 ? "Conductor" : `Persona ${i + 1}`}
                  value={name}
                  onChange={(e) => renamePassenger(i, e.target.value)}
                />
                {i > 0 && (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removePassenger(i)}>
                    <X />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPassenger}>
              <Plus />
              Añadir pasajero
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Row label="Coste total" value={result.totalCost} big />
          <Row label="Cada persona paga" value={result.costPerPassenger} />
          <Row label="El conductor cobra" value={result.driverReceives} />
          <Button
            type="button"
            disabled={distanceKm <= 0 || passengerNames.length < 1 || ticketLoading}
            onClick={generateTicket}
          >
            {ticketLoading ? <Loader2 className="animate-spin" /> : <Receipt />}
            Generar ticket
          </Button>
          {ticketError && <span className="text-xs text-destructive">{ticketError}</span>}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, big }: { label: string; value: number; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={big ? "text-2xl font-semibold" : "text-lg font-medium"}>
        {value.toFixed(2)} €
      </span>
    </div>
  );
}
