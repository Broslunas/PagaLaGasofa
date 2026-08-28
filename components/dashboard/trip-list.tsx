"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Trash2 } from "lucide-react";

interface Passenger {
  name: string;
  amount: number;
  hasPaid: boolean;
}

interface Trip {
  id: string;
  shareId: string;
  origin: string;
  destination: string;
  title: string | null;
  tollsCost: number;
  extraCosts: number;
  totalCost: number;
  passengers: Passenger[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const numberField = (v: string) => (v === "" ? 0 : Number(v));

export function TripList({ trips: initialTrips }: { trips: Trip[] }) {
  const [trips, setTrips] = useState(initialTrips);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(tripId: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(tripId)) next.delete(tripId);
      else next.add(tripId);
      return next;
    });
  }

  async function togglePaid(tripId: string, index: number, hasPaid: boolean) {
    setTrips((ts) =>
      ts.map((t) =>
        t.id === tripId ? { ...t, passengers: t.passengers.map((p, i) => (i === index ? { ...p, hasPaid } : p)) } : t
      )
    );
    await fetch(`/api/trips/${tripId}/passengers/${index}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasPaid }),
    });
  }

  async function updateTitle(tripId: string, title: string) {
    setTrips((ts) => ts.map((t) => (t.id === tripId ? { ...t, title: title || null } : t)));
    await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  async function updateCost(tripId: string, field: "tollsCost" | "extraCosts", value: number) {
    if (value < 0) return;
    setTrips((ts) =>
      ts.map((t) => {
        if (t.id !== tripId) return t;
        const diff = value - t[field];
        return {
          ...t,
          [field]: value,
          totalCost: round2(t.totalCost + diff),
          passengers: t.passengers.map((p) => ({ ...p, amount: round2(p.amount + diff / t.passengers.length) })),
        };
      })
    );
    await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function updateAmount(tripId: string, index: number, amount: number) {
    if (amount < 0) return;
    setTrips((ts) =>
      ts.map((t) => {
        if (t.id !== tripId) return t;
        const passengers = t.passengers.map((p, i) => (i === index ? { ...p, amount } : p));
        return { ...t, passengers, totalCost: round2(passengers.reduce((sum, p) => sum + p.amount, 0)) };
      })
    );
    await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passengers: [{ index, amount }] }),
    });
  }

  async function removeTrip(tripId: string) {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;
    if (!window.confirm(`¿Eliminar el viaje ${trip.origin} → ${trip.destination}? Esta acción no se puede deshacer.`)) return;
    setTrips((ts) => ts.filter((t) => t.id !== tripId));
    await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
  }

  if (trips.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no has generado ningún ticket.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {trips.map((trip) => (
        <div key={trip.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="mb-1 flex items-center gap-2">
            <Input
              className="h-auto flex-1 border-none px-0 font-medium shadow-none focus-visible:ring-0"
              value={trip.title ?? ""}
              placeholder={`${trip.origin} → ${trip.destination}`}
              onChange={(e) => updateTitle(trip.id, e.target.value)}
              aria-label="Nombre del viaje"
            />
            <span className="text-sm text-muted-foreground">{trip.totalCost.toFixed(2)} €</span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => toggleExpanded(trip.id)} title="Editar costes">
              <SlidersHorizontal />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeTrip(trip.id)} title="Eliminar viaje">
              <Trash2 />
            </Button>
          </div>
          <Link href={`/t/${trip.shareId}`} className="mb-2 block text-xs text-muted-foreground hover:underline">
            {trip.origin} → {trip.destination}
          </Link>

          {expanded.has(trip.id) && (
            <div className="mb-3 flex items-center gap-3 border-b pb-3 text-sm">
              <label className="flex items-center gap-1.5">
                Peajes
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  className="w-20"
                  value={trip.tollsCost}
                  onChange={(e) => updateCost(trip.id, "tollsCost", numberField(e.target.value))}
                />
              </label>
              <label className="flex items-center gap-1.5">
                Extras
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  className="w-20"
                  value={trip.extraCosts}
                  onChange={(e) => updateCost(trip.id, "extraCosts", numberField(e.target.value))}
                />
              </label>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {trip.passengers.map((p, i) => (
              <div key={i} className="group/field-label flex items-center gap-2 text-sm">
                <Checkbox checked={p.hasPaid} onCheckedChange={(checked) => togglePaid(trip.id, i, checked === true)} />
                <span className="flex-1">{p.name}</span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-20"
                  value={p.amount}
                  onChange={(e) => updateAmount(trip.id, i, numberField(e.target.value))}
                  aria-label={`Importe de ${p.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
