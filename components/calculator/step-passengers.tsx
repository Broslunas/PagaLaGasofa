"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import type { Passenger } from "@/components/calculator/calculator";

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function StepPassengers({
  passengers,
  stopLabels,
  addPassenger,
  removePassenger,
  renamePassenger,
  setPickupStop,
  setDropoffStop,
}: {
  passengers: Passenger[];
  stopLabels: string[];
  addPassenger: () => void;
  removePassenger: (i: number) => void;
  renamePassenger: (i: number, name: string) => void;
  setPickupStop: (i: number, stop: number) => void;
  setDropoffStop: (i: number, stop: number) => void;
}) {
  const hasStops = stopLabels.length > 2;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col gap-1.5 overflow-y-auto">
      <Label>Pasajeros</Label>
      {passengers.map((p, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-border/40 p-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={i === 0 ? "Conductor" : `Persona ${i + 1}`}
              value={p.name}
              onChange={(e) => renamePassenger(i, e.target.value)}
            />
            {i > 0 && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removePassenger(i)}>
                <X />
              </Button>
            )}
          </div>
          {hasStops && i > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Sube en</span>
              <select
                className={selectClass}
                value={p.pickupStop}
                onChange={(e) => setPickupStop(i, Number(e.target.value))}
              >
                {stopLabels.slice(0, -1).map((label, idx) => (
                  <option key={idx} value={idx} disabled={idx >= p.dropoffStop}>
                    {label}
                  </option>
                ))}
              </select>
              <span>y baja en</span>
              <select
                className={selectClass}
                value={p.dropoffStop}
                onChange={(e) => setDropoffStop(i, Number(e.target.value))}
              >
                {stopLabels.slice(1).map((label, idx) => (
                  <option key={idx + 1} value={idx + 1} disabled={idx + 1 <= p.pickupStop}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addPassenger}>
        <Plus />
        Añadir pasajero
      </Button>
    </div>
  );
}
