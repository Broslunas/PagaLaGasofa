import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/ticket/copy-link-button";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default async function TicketPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const trip = await prisma.trip.findUnique({ where: { shareId } });
  if (!trip) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {trip.origin} → {trip.destination}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Distancia" value={`${trip.distanceKm} km${trip.isRoundTrip ? " (ida y vuelta)" : ""}`} />
            <Row label="Coste total" value={`${trip.totalCost.toFixed(2)} €`} big />
            <Row label="Cada persona paga" value={`${trip.costPerPassenger.toFixed(2)} €`} />
            <Row label="El conductor cobra" value={`${trip.driverReceives.toFixed(2)} €`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pasajeros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {trip.passengers.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{p.name}</span>
                <span className="flex items-center gap-2">
                  <span>{p.amount.toFixed(2)} €</span>
                  <span className={p.hasPaid ? "text-green-600" : "text-muted-foreground"}>
                    {p.hasPaid ? "Pagado" : "Pendiente"}
                  </span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <CopyLinkButton shareId={shareId} />
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={`/t/${shareId}/opengraph-image`} download={`ticket-${shareId}.png`} />}
          >
            <Download />
            Descargar PNG
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={big ? "text-2xl font-semibold" : "text-lg font-medium"}>{value}</span>
    </div>
  );
}
