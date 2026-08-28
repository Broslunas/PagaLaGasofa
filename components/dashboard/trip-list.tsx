"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

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
  totalCost: number;
  passengers: Passenger[];
}

export function TripList({ trips: initialTrips }: { trips: Trip[] }) {
  const [trips, setTrips] = useState(initialTrips);

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

  if (trips.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no has generado ningún ticket.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {trips.map((trip) => (
        <div key={trip.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="mb-2 flex items-baseline justify-between">
            <Link href={`/t/${trip.shareId}`} className="font-medium hover:underline">
              {trip.origin} → {trip.destination}
            </Link>
            <span className="text-sm text-muted-foreground">{trip.totalCost.toFixed(2)} €</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {trip.passengers.map((p, i) => (
              <label key={i} className="group/field-label flex items-center gap-2 text-sm">
                <Checkbox checked={p.hasPaid} onCheckedChange={(checked) => togglePaid(trip.id, i, checked === true)} />
                <span className="flex-1">{p.name}</span>
                <span className="text-muted-foreground">{p.amount.toFixed(2)} €</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
