import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LiveViewer } from "@/components/live-share/live-viewer";
import { MapPin } from "lucide-react";

export default async function LiveSharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  // Solo confirma que el shareId existió alguna vez (404 real si nunca existió).
  // Si existe pero ya está parada/expirada, LiveViewer lo muestra como "no disponible"
  // en el primer poll — el link en sí sigue siendo un concepto válido.
  const share = await prisma.liveShare.findUnique({ where: { shareId } });
  if (!share) notFound();

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="text-primary" />
          <h1 className="font-heading text-xl font-bold">Ubicación compartida</h1>
        </div>
        <LiveViewer shareId={shareId} />
      </div>
    </div>
  );
}
