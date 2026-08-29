import Link from "next/link";
import { Fuel, MapPinned, LayoutDashboard, Radio, Leaf, Route, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const PUBLIC_TOOLS = [
  {
    href: "/viaje",
    icon: Fuel,
    title: "Reparte un viaje",
    description: "Calcula distancia, consumo y reparte el gasto de gasolina entre pasajeros. Genera un ticket para compartir.",
  },
  {
    href: "/gasolineras",
    icon: MapPinned,
    title: "Gasolineras",
    description: "Busca las gasolineras más baratas cerca de ti, filtra por combustible y guarda tus favoritas.",
  },
  {
    href: "/en-ruta",
    icon: Route,
    title: "Gasolineras en tu ruta",
    description: "Traza origen y destino y encuentra dónde repostar más barato de camino.",
  },
  {
    href: "/co2",
    icon: Leaf,
    title: "Huella de CO2",
    description: "Calcula cuánto CO2 emite tu ruta según el consumo y el combustible de tu coche.",
  },
];

// Requieren cuenta (app/dashboard/layout.tsx redirige a "/" si no hay sesión),
// así que solo se muestran a usuarios ya autenticados.
const ACCOUNT_TOOLS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    title: "Mi cuenta",
    description: "Tus vehículos, viajes, favoritas y estadísticas de gasto en un solo sitio.",
  },
  {
    href: "/dashboard/compartir",
    icon: Radio,
    title: "Compartir ubicación en vivo",
    description: "Comparte tu posición en directo con el grupo mientras conduces.",
  },
];

export default async function AppHome() {
  const session = await auth();
  const tools = session?.user ? [...PUBLIC_TOOLS, ...ACCOUNT_TOOLS] : PUBLIC_TOOLS;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-12 md:py-16">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">¿Qué quieres hacer?</h1>
        <p className="text-muted-foreground">Elige una herramienta para empezar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href} className="group">
              <Card className="h-full border-border/60 transition-all hover:border-primary/40 hover:shadow-lg">
                <CardHeader>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={20} />
                  </div>
                  <CardTitle className="mt-3 flex items-center gap-1.5 text-lg">
                    {tool.title}
                    <ArrowRight size={16} className="opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
