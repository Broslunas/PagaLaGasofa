import type { Metadata } from "next"

import { StartLiveForm } from "@/components/live/start-live-form"

export const metadata: Metadata = {
  title: "Compartir ubicación en vivo",
  description: "Comparte tu ubicación en directo con quien te espera: sin instalar nada ni crear cuenta.",
}

export default function LiveStartPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-balance text-3xl font-semibold">Comparte tu ubicación en directo</h1>
        <p className="text-muted-foreground">
          Crea un enlace y mándalo a quien te espera. Lo abren desde el navegador, sin instalar nada y sin cuenta.
        </p>
      </header>
      <StartLiveForm />
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        <li>· Solo se guarda tu posición actual, nunca el recorrido.</li>
        <li>· Al terminar la sesión se borra y el enlace deja de funcionar.</li>
        <li>· Puedes parar cuando quieras desde esta misma pantalla.</li>
      </ul>
    </div>
  )
}
