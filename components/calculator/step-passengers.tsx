"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export function StepPassengers({
  passengerNames,
  addPassenger,
  removePassenger,
  renamePassenger,
}: {
  passengerNames: string[];
  addPassenger: () => void;
  removePassenger: (i: number) => void;
  renamePassenger: (i: number, name: string) => void;
}) {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col gap-1.5 overflow-y-auto">
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
  );
}
