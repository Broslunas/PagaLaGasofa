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

export interface Passenger {
  name: string;
  pickupStop: number;
  dropoffStop: number;
}

// Evita índices de subida/bajada inválidos cuando el número de paradas
// cambia (p.ej. se quita una parada y un pasajero bajaba justo ahí). El
// conductor (índice 0) siempre hace la ruta completa, igual que fuerza el
// servidor en app/api/trips/route.ts — si no, al añadir una parada su
// dropoffStop se queda anclado al viejo tramo único y paga de menos.
function clampPassenger(p: Passenger, lastStopIndex: number, isDriver = false): Passenger {
  if (isDriver) return { ...p, pickupStop: 0, dropoffStop: lastStopIndex };
  const pickupStop = Math.max(0, Math.min(p.pickupStop, lastStopIndex - 1));
  let dropoffStop = Math.max(1, Math.min(p.dropoffStop, lastStopIndex));
  if (dropoffStop <= pickupStop) dropoffStop = Math.min(pickupStop + 1, lastStopIndex);
  return { ...p, pickupStop, dropoffStop };
}

export function Calculator() {
  const [step, setStep] = useState(0);

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
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(1.5);
  const [fuelType, setFuelType] = useState("gasolina95");
  const [tollsCost, setTollsCost] = useState(0);
  const [extraCosts, setExtraCosts] = useState(0);
  const lastStopIndex = waypoints.length + 1;
  const [passengers, setPassengers] = useState<Passenger[]>([{ name: "", pickupStop: 0, dropoffStop: 1 }]);

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
    { id: string; brand: string; model: string; year: number; fuelType: string; avgConsumption: number; isDefault: boolean }[]
  >([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [myFavorites, setMyFavorites] = useState<
    { stationId: string; name: string; brand: string; provinceId: string | null }[]
  >([]);
  const [favPriceLoading, setFavPriceLoading] = useState(false);
  const [favPriceError, setFavPriceError] = useState("");
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [saveVehicleError, setSaveVehicleError] = useState("");

  useEffect(() => {
    if (!authSession?.user) {
      setMyVehicles([]);
      setMyFavorites([]);
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
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMyFavorites);
  }, [authSession?.user]);

  async function applyFavoritePrice(stationId: string, provinceId: string | null, fuelKey: string) {
    setFavPriceLoading(true);
    setFavPriceError("");
    try {
      const url = provinceId
        ? `/api/gasolineras/${stationId}?provincia=${provinceId}`
        : `/api/gasolineras/${stationId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al consultar el precio");
      const price = data.station?.prices?.[fuelKey];
      if (typeof price !== "number") throw new Error("Esa gasolinera no declara ese combustible");
      setFuelPricePerLiter(price);
    } catch (e) {
      setFavPriceError(e instanceof Error ? e.message : "Error al consultar el precio");
    } finally {
      setFavPriceLoading(false);
    }
  }

  async function saveVehicle() {
    setSavingVehicle(true);
    setSaveVehicleError("");
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: vehicleBrand,
          model: vehicleModel,
          year: Number(vehicleYear) || new Date().getFullYear(),
          fuelType: "Gasolina",
          avgConsumption: consumptionL100,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar el vehículo");
      setMyVehicles((vs) => [data, ...vs]);
      setSelectedVehicleId(data.id);
    } catch (e) {
      setSaveVehicleError(e instanceof Error ? e.message : "Error al guardar el vehículo");
    } finally {
      setSavingVehicle(false);
    }
  }

  // Si el número de paradas cambia, reencuadra los índices de subida/bajada
  // de cada pasajero para que sigan siendo válidos.
  useEffect(() => {
    setPassengers((ps) => ps.map((p, i) => clampPassenger(p, lastStopIndex, i === 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastStopIndex]);

  function selectVehicle(id: string) {
    setSelectedVehicleId(id);
    const vehicle = myVehicles.find((v) => v.id === id);
    if (vehicle) setConsumptionL100(vehicle.avgConsumption);
  }

  function addPassenger() {
    setPassengers((ps) => [...ps, { name: "", pickupStop: 0, dropoffStop: lastStopIndex }]);
  }
  function removePassenger(i: number) {
    setPassengers((ps) => ps.filter((_, idx) => idx !== i));
  }
  function renamePassenger(i: number, name: string) {
    setPassengers((ps) => ps.map((p, idx) => (idx === i ? { ...p, name } : p)));
  }
  function setPickupStop(i: number, stop: number) {
    setPassengers((ps) => ps.map((p, idx) => (idx === i ? clampPassenger({ ...p, pickupStop: stop }, lastStopIndex) : p)));
  }
  function setDropoffStop(i: number, stop: number) {
    setPassengers((ps) => ps.map((p, idx) => (idx === i ? clampPassenger({ ...p, dropoffStop: stop }, lastStopIndex) : p)));
  }

  async function generateTicket() {
    setTicketLoading(true);
    setTicketError("");
    try {
      const filledWaypoints = waypoints.filter((w): w is GeoPoint => w !== null);
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          origin: origin?.label ?? "",
          destination: destination?.label ?? "",
          originLat: origin?.lat,
          originLon: origin?.lon,
          destLat: destination?.lat,
          destLon: destination?.lon,
          waypoints: filledWaypoints.map((w) => ({ label: w.label, lat: w.lat, lon: w.lon })),
          geometry: routePolyline.length > 0 ? JSON.stringify(routePolyline) : undefined,
          legsKm,
          isRoundTrip,
          consumptionL100,
          fuelPricePerLiter,
          fuelType,
          tollsCost,
          extraCosts,
          passengers,
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
      if (Array.isArray(data.geometry)) {
        setRoutePolyline(data.geometry);
      }
    } catch (e) {
      setDistanceError(e instanceof Error ? e.message : "Error al calcular la distancia");
    } finally {
      setDistanceLoading(false);
    }
  }

  // Ruta por carretera automática (OSRM) en cuanto todos los puntos (origen,
  // paradas, destino) están rellenos, sin esperar a un clic.
  const pointsKey = JSON.stringify([origin, ...waypoints, destination].map((p) => (p ? [p.lat, p.lon] : null)));
  useEffect(() => {
    if (origin && destination && waypoints.every((w) => w)) {
      fetchDistance();
    } else {
      setRoutePolyline([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  // Manual: si no hay paradas, el km editable a mano sigue funcionando como antes.
  function handleDistanceKmChange(n: number) {
    setDistanceKm(n);
    if (waypoints.length === 0) setLegsKm([n]);
  }

  const result = calculateTrip({
    legsKm: legsKm.length === lastStopIndex ? legsKm : [distanceKm],
    isRoundTrip,
    consumptionL100,
    fuelPricePerLiter,
    tollsCost,
    extraCosts,
    passengers: passengers.map((p, i) => clampPassenger(p, lastStopIndex, i === 0)),
  });

  const stopLabels = ["Origen", ...waypoints.map((_, i) => `Parada ${i + 1}`), "Destino"];

  const isLast = step === STEPS.length - 1;
  const canAdvance = step !== 0 || (distanceKm > 0 && waypoints.every((w) => w));

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
            fuelType={fuelType}
            setFuelType={setFuelType}
            tollsCost={tollsCost}
            setTollsCost={setTollsCost}
            extraCosts={extraCosts}
            setExtraCosts={setExtraCosts}
            myFavorites={myFavorites}
            applyFavoritePrice={applyFavoritePrice}
            favPriceLoading={favPriceLoading}
            favPriceError={favPriceError}
            isLoggedIn={!!authSession?.user}
            saveVehicle={saveVehicle}
            savingVehicle={savingVehicle}
            saveVehicleError={saveVehicleError}
          />
        )}
        {step === 2 && (
          <StepPassengers
            passengers={passengers}
            stopLabels={stopLabels}
            addPassenger={addPassenger}
            removePassenger={removePassenger}
            renamePassenger={renamePassenger}
            setPickupStop={setPickupStop}
            setDropoffStop={setDropoffStop}
          />
        )}
        {step === 3 && (
          <StepSummary
            title={title}
            origin={origin}
            destination={destination}
            waypoints={waypoints}
            distanceKm={distanceKm}
            isRoundTrip={isRoundTrip}
            consumptionL100={consumptionL100}
            passengers={passengers}
            stopLabels={stopLabels}
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
