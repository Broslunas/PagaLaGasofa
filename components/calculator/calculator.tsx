"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { calculateTrip } from "@/lib/calculator";
import { type GeoPoint } from "@/components/calculator/location-field";
import { StepRoute } from "@/components/calculator/step-route";
import { StepVehicle } from "@/components/calculator/step-vehicle";
import { StepPassengers } from "@/components/calculator/step-passengers";
import { StepSummary } from "@/components/calculator/step-summary";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = ["Ruta", "Vehículo y coste", "Pasajeros", "Resumen"] as const;

export function Calculator() {
  const [step, setStep] = useState(0);

  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
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

  const { data: authSession } = useSession();
  const [myVehicles, setMyVehicles] = useState<
    { id: string; brand: string; model: string; year: number; avgConsumption: number; isDefault: boolean }[]
  >([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    if (!authSession?.user) {
      setMyVehicles([]);
      return;
    }
    fetch("/api/vehicles")
      .then((res) => (res.ok ? res.json() : []))
      .then((vehicles) => {
        setMyVehicles(vehicles);
        const def = vehicles.find((v: { isDefault: boolean }) => v.isDefault);
        if (def) {
          setSelectedVehicleId(def.id);
          setConsumptionL100(def.avgConsumption);
        }
      });
  }, [authSession?.user]);

  function selectVehicle(id: string) {
    setSelectedVehicleId(id);
    const vehicle = myVehicles.find((v) => v.id === id);
    if (vehicle) setConsumptionL100(vehicle.avgConsumption);
  }

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
          originLat: origin?.lat,
          originLon: origin?.lon,
          destLat: destination?.lat,
          destLon: destination?.lon,
          geometry: routePolyline.length > 0 ? JSON.stringify(routePolyline) : undefined,
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
      if (Array.isArray(data.geometry)) {
        setRoutePolyline(data.geometry);
      }
    } catch (e) {
      setDistanceError(e instanceof Error ? e.message : "Error al calcular la distancia");
    } finally {
      setDistanceLoading(false);
    }
  }

  // Ruta por carretera automática (OSRM) en cuanto hay origen y destino, sin esperar a un clic.
  useEffect(() => {
    if (origin && destination) {
      fetchDistance();
    } else {
      setRoutePolyline([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lon, destination?.lat, destination?.lon]);

  const result = calculateTrip({
    distanceKm,
    isRoundTrip,
    consumptionL100,
    fuelPricePerLiter,
    tollsCost,
    extraCosts,
    passengersCount: passengerNames.length,
  });

  const isLast = step === STEPS.length - 1;
  const canAdvance = step !== 0 || distanceKm > 0;

  function next() {
    if (canAdvance) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="flex h-full min-h-0 w-full max-w-5xl flex-col gap-3 p-3 md:p-4">
      <ol className="flex shrink-0 items-center justify-center gap-1.5 sm:gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/25 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`hidden text-xs sm:inline ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border sm:w-8" />}
          </li>
        ))}
      </ol>

      <div className="min-h-0 flex-1">
        {step === 0 && (
          <StepRoute
            origin={origin}
            destination={destination}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            distanceKm={distanceKm}
            setDistanceKm={setDistanceKm}
            routePolyline={routePolyline}
            distanceLoading={distanceLoading}
            distanceError={distanceError}
            onRetryDistance={fetchDistance}
          />
        )}
        {step === 1 && (
          <StepVehicle
            isRoundTrip={isRoundTrip}
            setIsRoundTrip={setIsRoundTrip}
            myVehicles={myVehicles}
            selectedVehicleId={selectedVehicleId}
            selectVehicle={selectVehicle}
            vehicleBrand={vehicleBrand}
            setVehicleBrand={setVehicleBrand}
            vehicleModel={vehicleModel}
            setVehicleModel={setVehicleModel}
            vehicleYear={vehicleYear}
            setVehicleYear={setVehicleYear}
            aiLoading={aiLoading}
            aiError={aiError}
            estimateConsumption={estimateConsumption}
            consumptionL100={consumptionL100}
            setConsumptionL100={setConsumptionL100}
            fuelPricePerLiter={fuelPricePerLiter}
            setFuelPricePerLiter={setFuelPricePerLiter}
            tollsCost={tollsCost}
            setTollsCost={setTollsCost}
            extraCosts={extraCosts}
            setExtraCosts={setExtraCosts}
          />
        )}
        {step === 2 && (
          <StepPassengers
            passengerNames={passengerNames}
            addPassenger={addPassenger}
            removePassenger={removePassenger}
            renamePassenger={renamePassenger}
          />
        )}
        {step === 3 && (
          <StepSummary
            origin={origin}
            destination={destination}
            distanceKm={distanceKm}
            isRoundTrip={isRoundTrip}
            consumptionL100={consumptionL100}
            passengerNames={passengerNames}
            routePolyline={routePolyline}
            result={result}
            ticketLoading={ticketLoading}
            ticketError={ticketError}
            onGenerate={generateTicket}
          />
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between">
        <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
          <ChevronLeft />
          Atrás
        </Button>
        {!isLast && (
          <Button type="button" onClick={next} disabled={!canAdvance}>
            Siguiente
            <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}
