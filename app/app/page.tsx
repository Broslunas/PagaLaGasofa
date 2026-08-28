import { Calculator } from "@/components/calculator/calculator";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-4 py-12">
      <h1 className="text-2xl font-semibold">Calculadora de gasofa</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Calcula y reparte el gasto de gasolina entre amigos
      </p>
      <Calculator />
    </div>
  );
}
