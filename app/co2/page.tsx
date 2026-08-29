"use client";

import { useEffect, useState } from "react";
import { co2ForTrip } from "@/lib/co2";
import { FUEL_TYPES } from "@/lib/provinces";
import { type GeoPoint } from "@/components/calculator/location-field";
import { StepRoute } from "@/components/calculator/step-route";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Leaf, TreePine } from "lucide-react";

const numberField = (v: string) => (v === "" ? 0 : Number(v));
const KG_CO2_ABSORBED_PER_TREE_YEAR = 21; // aprox., cifra habitual de divulgación

const selectClass =
  "h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-card px-2.5 py-1 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-card";

export default function Co2Page() {
  const [title, setTitle] = useState("");
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [waypoints, setWaypoints] = useState<(GeoPoint | null)[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [legsKm, setLegsKm] = useState<number[]>([]);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState("");

  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [consumptionL100, setConsumptionL100] = useState(6);
  const [fuelType, setFuelType] = useState("gasolina95");

  async function fetchDistance() {
    const points = [origin, ...waypoints, destination];
    if (points.some((p) => !p)) return;
    setDistanceLoading(true);
    setDistanceError("");
    try {
      const res = await fetch("/api/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: points.map((p) => ({ lat: p!.lat, lon: p!.lon })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al calcular la distancia");
      setDistanceKm(data.distanceKm);
      setLegsKm(Array.isArray(data.legs) ? data.legs : []);
      if (Array.isArray(data.geometry)) setRoutePolyline(data.geometry);
    } catch (e) {
      setDistanceError(e instanceof Error ? e.message : "Error al calcular la distancia");
    } finally {
      setDistanceLoading(false);
    }
  }

  const pointsKey = JSON.stringify([origin, ...waypoints, destination].map((p) => (p ? [p.lat, p.lon] : null)));
  useEffect(() => {
    if (origin && destination && waypoints.every((w) => w)) {
      fetchDistance();
    } else {
      setRoutePolyline([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  function handleDistanceKmChange(n: number) {
    setDistanceKm(n);
    if (waypoints.length === 0) setLegsKm([n]);
  }

  const legs = legsKm.length > 0 ? legsKm : [distanceKm];
  const { totalKm, liters, co2Kg } = co2ForTrip({ legsKm: legs, isRoundTrip, consumptionL100, fuelType });
  const treesPerYear = co2Kg / KG_CO2_ABSORBED_PER_TREE_YEAR;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 md:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Huella de CO2 del viaje</h1>
        <p className="text-muted-foreground">Traza la ruta y mira cuánto CO2 emite según tu coche.</p>
      </div>

      <div className="h-[420px] md:h-[480px]">
        <StepRoute
          title={title}
          onTitleChange={setTitle}
          origin={origin}
          destination={destination}
          waypoints={waypoints}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          onWaypointsChange={setWaypoints}
          distanceKm={distanceKm}
          setDistanceKm={handleDistanceKmChange}
          routePolyline={routePolyline}
          distanceLoading={distanceLoading}
          distanceError={distanceError}
          onRetryDistance={fetchDistance}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tu coche</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isRoundTrip} onCheckedChange={(v) => setIsRoundTrip(v === true)} />
              Ida y vuelta
            </label>
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
                <Label htmlFor="fuelType">Combustible</Label>
                <select id="fuelType" className={selectClass} value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                  {FUEL_TYPES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Leaf size={16} className="text-primary" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Distancia</p>
              <p className="text-lg font-semibold">{totalKm.toFixed(0)} km</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Combustible</p>
              <p className="text-lg font-semibold">{liters.toFixed(1)} L</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CO2 emitido</p>
              <p className="text-lg font-semibold text-primary">{co2Kg.toFixed(1)} kg</p>
            </div>
            {co2Kg > 0 && (
              <p className="col-span-3 mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <TreePine size={13} />
                Lo que absorben {treesPerYear.toFixed(1)} árboles en un año
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
