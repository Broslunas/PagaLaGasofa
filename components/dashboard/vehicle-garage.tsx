"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Trash2, Loader2, Plus } from "lucide-react";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  avgConsumption: number;
  isDefault: boolean;
}

const numberField = (v: string) => (v === "" ? 0 : Number(v));

export function VehicleGarage({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [fuelType, setFuelType] = useState("Gasolina");
  const [avgConsumption, setAvgConsumption] = useState(6);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addVehicle() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model, year, fuelType, avgConsumption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar el vehículo");
      // si es el primero, el servidor lo marca isDefault: true — refleja eso localmente
      setVehicles((vs) => (vs.length === 0 ? [data, ...vs] : [data, ...vs]));
      setBrand("");
      setModel("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el vehículo");
    } finally {
      setSaving(false);
    }
  }

  async function updateConsumption(id: string, value: number) {
    if (value <= 0) return;
    setVehicles((vs) => vs.map((v) => (v.id === id ? { ...v, avgConsumption: value } : v)));
    await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avgConsumption: value }),
    });
  }

  async function setDefault(id: string) {
    setVehicles((vs) => vs.map((v) => ({ ...v, isDefault: v.id === id })));
    await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
  }

  async function removeVehicle(id: string) {
    const wasDefault = vehicles.find((v) => v.id === id)?.isDefault;
    const rest = vehicles.filter((v) => v.id !== id);
    // si borramos el default, el servidor promociona el más reciente que quede
    if (wasDefault && rest.length > 0) rest[0] = { ...rest[0], isDefault: true };
    setVehicles(rest);
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading text-base font-medium">Mi garage</h2>

      {vehicles.length === 0 && (
        <p className="text-sm text-muted-foreground">Aún no tienes vehículos guardados.</p>
      )}

      {vehicles.map((v) => (
        <div key={v.id} className="flex items-center gap-2 rounded-lg border p-2">
          <button type="button" onClick={() => setDefault(v.id)} title="Marcar como por defecto">
            <Star className={v.isDefault ? "fill-primary text-primary" : "text-muted-foreground"} size={18} />
          </button>
          <span className="flex-1 text-sm">
            {v.brand} {v.model} ({v.year}) — {v.fuelType}
          </span>
          <Input
            type="number"
            min={0}
            step={0.1}
            className="w-20"
            value={v.avgConsumption}
            onChange={(e) => updateConsumption(v.id, numberField(e.target.value))}
          />
          <span className="text-xs text-muted-foreground">L/100km</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeVehicle(v.id)}>
            <Trash2 />
          </Button>
        </div>
      ))}

      <div className="mt-2 flex flex-col gap-2 border-t pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="vBrand">Marca</Label>
            <Input id="vBrand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="vModel">Modelo</Label>
            <Input id="vModel" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="vYear">Año</Label>
            <Input id="vYear" type="number" value={year} onChange={(e) => setYear(numberField(e.target.value))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="vFuel">Combustible</Label>
            <Input id="vFuel" value={fuelType} onChange={(e) => setFuelType(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="vConsumption">Consumo (L/100km)</Label>
            <Input
              id="vConsumption"
              type="number"
              min={0}
              step={0.1}
              value={avgConsumption}
              onChange={(e) => setAvgConsumption(numberField(e.target.value))}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" disabled={!brand || !model || saving} onClick={addVehicle}>
            {saving ? <Loader2 className="animate-spin" /> : <Plus />}
            Añadir vehículo
          </Button>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>
    </div>
  );
}
