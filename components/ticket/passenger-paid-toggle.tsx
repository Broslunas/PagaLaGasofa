"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";

// Autoservicio: cualquiera con el link del ticket puede marcarse a sí mismo
// (o a otro pasajero) como pagado, sin login. El shareId ya es la
// autorización, igual que para ver el ticket.
export function PassengerPaidToggle({
  shareId,
  index,
  initialHasPaid,
}: {
  shareId: string;
  index: number;
  initialHasPaid: boolean;
}) {
  const [hasPaid, setHasPaid] = useState(initialHasPaid);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (saving) return;
    const next = !hasPaid;
    setHasPaid(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/trips/by-share/${shareId}/passengers/${index}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasPaid: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setHasPaid(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      title="Marcar como pagado / pendiente"
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-60 ${
        hasPaid ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
      }`}
    >
      {hasPaid ? (
        <>
          <CheckCircle2 size={12} /> Pagado
        </>
      ) : (
        <>
          <CircleDashed size={12} /> Pendiente
        </>
      )}
    </button>
  );
}
