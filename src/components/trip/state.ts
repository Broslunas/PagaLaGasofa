import { calculateTrip, TripCalculationError, type TripResult } from "@/lib/trip/calculator"
import { FUEL_INFO, type FuelType } from "@/lib/trip/fuel"
import { parseDecimal } from "@/lib/format"
import type { PlaceResult, RouteResult } from "@/lib/routing/types"
import { LIMITS, toCalculatorInput, tripDraftSchema, type TripDraft } from "@/lib/trip/schema"

export type Step = "route" | "vehicle" | "passengers" | "summary"
export const STEPS: { id: Step; label: string }[] = [
  { id: "route", label: "Ruta" },
  { id: "vehicle", label: "Coste" },
  { id: "passengers", label: "Pasajeros" },
  { id: "summary", label: "Resumen" },
]

export type SplitModeId = "legs" | "equal" | "percent" | "manual"

export interface PassengerState {
  id: string
  name: string
  pickup: number
  /** `null` = hasta el destino, aunque cambie el número de paradas. */
  dropoff: number | null
  /** Porcentaje o euros, como texto, según el modo de reparto. */
  value: string
}

export interface ExtraState {
  id: string
  label: string
  amount: string
}

export interface PlannerState {
  step: Step
  origin: PlaceResult | null
  destination: PlaceResult | null
  /** `null` = parada añadida pero aún sin lugar elegido. */
  waypoints: (PlaceResult | null)[]
  isRoundTrip: boolean
  route: RouteResult | null
  routeStatus: "idle" | "loading" | "error"
  routeError: string | null

  fuelType: FuelType
  consumption: string
  price: string
  tolls: string
  vehicleLabel: string | null
  /** Marca y modelo si el vehículo viene del catálogo o del garaje; sirve para guardarlo. */
  vehicleMeta: { brand: string; model: string } | null
  extras: ExtraState[]

  passengers: PassengerState[]
  driverPays: boolean
  splitMode: SplitModeId
  title: string
}

let counter = 0
/** Solo se usa como `key` de React; un contador evita valores no deterministas en el prerenderizado. */
export const uid = () => `i${(counter++).toString(36)}`

export const newPassenger = (n: number): PassengerState => ({
  id: uid(),
  name: n === 0 ? "Yo" : `Persona ${n}`,
  pickup: 0,
  dropoff: null,
  value: "",
})

export const initialState = (): PlannerState => ({
  step: "route",
  origin: null,
  destination: null,
  waypoints: [],
  isRoundTrip: false,
  route: null,
  routeStatus: "idle",
  routeError: null,
  fuelType: "gasolina95",
  consumption: "",
  price: "",
  tolls: "",
  vehicleLabel: null,
  vehicleMeta: null,
  extras: [],
  passengers: [newPassenger(0), newPassenger(1)],
  driverPays: true,
  splitMode: "legs",
  title: "",
})

export type Action =
  | { type: "step"; step: Step }
  | { type: "origin"; place: PlaceResult | null }
  | { type: "destination"; place: PlaceResult | null }
  | { type: "waypoint-add" }
  | { type: "waypoint-set"; index: number; place: PlaceResult | null }
  | { type: "waypoint-remove"; index: number }
  | { type: "waypoint-move"; index: number; by: -1 | 1 }
  | { type: "round-trip"; value: boolean }
  | { type: "route-loading" }
  | { type: "route-loaded"; route: RouteResult }
  | { type: "route-error"; message: string }
  | { type: "fuel"; fuelType: FuelType }
  | { type: "consumption"; value: string }
  | { type: "price"; value: string }
  | { type: "tolls"; value: string }
  | { type: "vehicle"; label: string | null; meta: { brand: string; model: string } | null; fuelType: FuelType; consumption: number }
  | { type: "extra-add" }
  | { type: "extra-set"; id: string; patch: Partial<Omit<ExtraState, "id">> }
  | { type: "extra-remove"; id: string }
  | { type: "passenger-add" }
  | { type: "passenger-set"; id: string; patch: Partial<Omit<PassengerState, "id">> }
  | { type: "passenger-remove"; id: string }
  | { type: "driver-pays"; value: boolean }
  | { type: "split-mode"; mode: SplitModeId; prefill?: string[] }
  | { type: "title"; value: string }
  | { type: "reset" }

export function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case "step":
      return { ...state, step: action.step }
    case "origin":
      return { ...state, origin: action.place, route: null, routeStatus: "idle", routeError: null }
    case "destination":
      return { ...state, destination: action.place, route: null, routeStatus: "idle", routeError: null }
    case "waypoint-add":
      return state.waypoints.length >= LIMITS.stops.max - 2
        ? state
        : { ...state, waypoints: [...state.waypoints, null], route: null, routeStatus: "idle" }
    case "waypoint-set":
      return {
        ...state,
        waypoints: state.waypoints.map((w, i) => (i === action.index ? action.place : w)),
        route: null,
        routeStatus: "idle",
      }
    case "waypoint-remove":
      return {
        ...state,
        waypoints: state.waypoints.filter((_, i) => i !== action.index),
        route: null,
        routeStatus: "idle",
      }
    case "waypoint-move": {
      const j = action.index + action.by
      if (j < 0 || j >= state.waypoints.length) return state
      const waypoints = state.waypoints.slice()
      ;[waypoints[action.index], waypoints[j]] = [waypoints[j], waypoints[action.index]]
      return { ...state, waypoints, route: null, routeStatus: "idle" }
    }
    case "round-trip":
      return { ...state, isRoundTrip: action.value }
    case "route-loading":
      return { ...state, routeStatus: "loading", routeError: null }
    case "route-loaded":
      return { ...state, route: action.route, routeStatus: "idle", routeError: null }
    case "route-error":
      return { ...state, route: null, routeStatus: "error", routeError: action.message }
    case "fuel":
      return { ...state, fuelType: action.fuelType, vehicleLabel: null, vehicleMeta: null }
    case "consumption":
      return { ...state, consumption: action.value, vehicleLabel: null, vehicleMeta: null }
    case "price":
      return { ...state, price: action.value }
    case "tolls":
      return { ...state, tolls: action.value }
    case "vehicle":
      return {
        ...state,
        vehicleLabel: action.label,
        vehicleMeta: action.meta,
        fuelType: action.fuelType,
        consumption: String(action.consumption).replace(".", ","),
      }
    case "extra-add":
      return state.extras.length >= LIMITS.extras
        ? state
        : { ...state, extras: [...state.extras, { id: uid(), label: "", amount: "" }] }
    case "extra-set":
      return { ...state, extras: state.extras.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)) }
    case "extra-remove":
      return { ...state, extras: state.extras.filter((e) => e.id !== action.id) }
    case "passenger-add":
      return state.passengers.length >= LIMITS.passengers.max
        ? state
        : { ...state, passengers: [...state.passengers, newPassenger(state.passengers.length)] }
    case "passenger-set":
      return {
        ...state,
        passengers: state.passengers.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      }
    case "passenger-remove":
      return { ...state, passengers: state.passengers.filter((p, i) => i === 0 || p.id !== action.id) }
    case "driver-pays":
      return { ...state, driverPays: action.value }
    case "split-mode":
      return {
        ...state,
        splitMode: action.mode,
        passengers: action.prefill
          ? state.passengers.map((p, i) => ({ ...p, value: action.prefill![i] ?? "" }))
          : state.passengers,
      }
    case "title":
      return { ...state, title: action.value }
    case "reset":
      return initialState()
  }
}

/** Lugares en orden: origen, paradas, destino (solo los ya elegidos). */
export function stopPlaces(state: PlannerState): PlaceResult[] {
  return [state.origin, ...state.waypoints, state.destination].filter((p): p is PlaceResult => Boolean(p))
}

export const legCount = (state: PlannerState) => state.waypoints.length + 1

export type DraftResult = { ok: true; draft: TripDraft } | { ok: false; error: string }

/** Convierte el estado del formulario (textos) en un borrador validado del viaje. */
export function buildDraft(state: PlannerState): DraftResult {
  const fail = (error: string): DraftResult => ({ ok: false, error })
  const { origin, destination, route } = state
  if (!origin || !destination) return fail("Elige origen y destino")
  if (state.waypoints.some((w) => !w)) return fail("Completa o quita las paradas vacías")
  if (!route) return fail("Calculando la ruta…")

  const consumption = parseDecimal(state.consumption)
  const price = parseDecimal(state.price)
  const tolls = state.tolls.trim() === "" ? 0 : parseDecimal(state.tolls)
  if (!(consumption > 0)) return fail("Indica el consumo del vehículo")
  if (!(price > 0)) return fail("Indica el precio del combustible")
  if (Number.isNaN(tolls) || tolls < 0) return fail("Peajes no válidos")

  const extras = []
  for (const e of state.extras) {
    const amount = parseDecimal(e.amount)
    if (!e.label.trim() && e.amount.trim() === "") continue
    if (!e.label.trim() || !(amount >= 0)) return fail("Revisa los gastos extra")
    extras.push({ label: e.label.trim(), amount })
  }

  const stops = stopPlaces(state).map(({ label, lat, lng }) => ({ label, lat, lng }))
  const legs = stops.length - 1
  if (route.legsKm.length !== legs) return fail("Calculando la ruta…")

  const passengers = state.passengers.map((p, i) => {
    const full = i === 0
    const pickup = full ? 0 : Math.min(p.pickup, legs - 1)
    const dropoff = full || p.dropoff === null ? legs : Math.min(Math.max(p.dropoff, pickup + 1), legs)
    return { name: p.name.trim(), pickupStop: pickup, dropoffStop: dropoff }
  })

  let split: TripDraft["split"]
  if (state.splitMode === "percent") {
    const percents = state.passengers.map((p) => parseDecimal(p.value))
    if (percents.some((n) => !(n >= 0))) return fail("Indica el porcentaje de cada persona")
    if (Math.abs(percents.reduce((a, b) => a + b, 0) - 100) > 0.01) return fail("Los porcentajes deben sumar 100 %")
    split = { mode: "percent", percents }
  } else if (state.splitMode === "manual") {
    const amounts = state.passengers.map((p) => parseDecimal(p.value))
    if (amounts.some((n) => !(n >= 0))) return fail("Indica el importe de cada persona")
    split = { mode: "manual", amounts }
  } else {
    split = { mode: state.splitMode }
  }

  const parsed = tripDraftSchema.safeParse({
    title: state.title.trim() || undefined,
    stops,
    legsKm: route.legsKm,
    geometry: route.geometry,
    isRoundTrip: state.isRoundTrip,
    fuelType: state.fuelType,
    consumptionPer100km: consumption,
    pricePerUnit: price,
    tolls,
    extras,
    driverPays: state.driverPays,
    passengers,
    split,
  })
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos no válidos")
  return { ok: true, draft: parsed.data }
}

export type CalcOutcome =
  | { ok: true; draft: TripDraft; result: TripResult }
  | { ok: false; error: string }

export function computeOutcome(state: PlannerState): CalcOutcome {
  const built = buildDraft(state)
  if (!built.ok) return built
  try {
    return { ok: true, draft: built.draft, result: calculateTrip(toCalculatorInput(built.draft)) }
  } catch (error) {
    return { ok: false, error: error instanceof TripCalculationError ? error.message : "No se pudo calcular" }
  }
}

export const unitLabel = (fuel: FuelType) => (FUEL_INFO[fuel].unit === "kWh" ? "kWh" : "l")

/** Porcentajes equitativos que suman exactamente 100 (el resto va al primero). */
export function equalPercents(n: number): string[] {
  const base = Math.floor((100 / n) * 100) / 100
  const first = Math.round((100 - base * (n - 1)) * 100) / 100
  return Array.from({ length: n }, (_, i) => String(i === 0 ? first : base).replace(".", ","))
}

export type StepValidity = Record<Step, string | null>

/** Mensaje de bloqueo por paso (`null` = se puede continuar). */
export function stepIssues(state: PlannerState): StepValidity {
  const stops = stopPlaces(state)
  const route =
    !state.origin || !state.destination
      ? "Elige origen y destino"
      : state.waypoints.some((w) => !w)
        ? "Completa o quita las paradas vacías"
        : state.routeStatus === "loading"
          ? "Calculando la ruta…"
          : !state.route || state.route.legsKm.length !== stops.length - 1
            ? (state.routeError ?? "Calculando la ruta…")
            : null

  const consumption = parseDecimal(state.consumption)
  const price = parseDecimal(state.price)
  const vehicle = !(consumption > 0)
    ? "Indica el consumo"
    : !(price > 0)
      ? "Indica el precio del combustible"
      : null

  const names = state.passengers.some((p) => !p.name.trim()) ? "Pon nombre a todos los pasajeros" : null
  const outcome = route || vehicle ? null : computeOutcome(state)
  const passengers =
    names ??
    (outcome && !outcome.ok ? outcome.error : null) ??
    (outcome?.ok && outcome.result.balanceCents !== 0 ? "Los importes deben sumar el total" : null)

  return { route, vehicle, passengers, summary: route ?? vehicle ?? passengers }
}
