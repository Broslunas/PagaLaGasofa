"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Fuel, ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Car, Receipt, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signIn("google", { callbackUrl });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-2 lg:items-center">
        {/* Left column: value prop */}
        <div className="hidden flex-col justify-center gap-6 lg:flex">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Accede a tu cuenta de PagaLaGasofa
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Controla y divide tus viajes sin líos.
            </h1>
            <p className="text-base text-muted-foreground">
              Guarda tus rutas, gestiona tu garaje de vehículos y ten a mano tus gasolineras favoritas.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-sm text-foreground/90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-4 w-4" />
              </div>
              <span>Historial completo de tickets y viajes compartidos</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-foreground/90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Car className="h-4 w-4" />
              </div>
              <span>Tu garaje personalizado con consumos reales</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-foreground/90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Heart className="h-4 w-4" />
              </div>
              <span>Gasolineras favoritas con precios en tiempo real</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/40">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Inicio de sesión seguro mediante OAuth de Google. Sin contraseñas.</span>
          </div>
        </div>

        {/* Right column: Login card */}
        <div>
          <Card className="border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
            <CardContent className="flex flex-col p-6 sm:p-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 shadow-md shadow-primary/20">
                  <Image src="/logo.svg" alt="Logo" width={28} height={28} className="brightness-0 invert" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Bienvenido de nuevo</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inicia sesión para acceder a tu panel de control
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-xs text-destructive">
                  Hubo un problema al autenticar con Google. Inténtalo de nuevo.
                </div>
              )}

              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border-border/80 bg-background text-sm font-semibold shadow-sm transition-all hover:bg-accent hover:border-border active:scale-[0.99]"
                >
                  <GoogleIcon className="h-5 w-5" />
                  <span>{loading ? "Conectando con Google..." : "Continuar con Google"}</span>
                </Button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <span className="relative bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                    100% Gratuito y Rápido
                  </span>
                </div>

                <div className="rounded-xl border border-border/40 bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Sin registros complicados
                  </div>
                  <p className="pl-6 text-[11px] leading-relaxed">
                    Al entrar, creamos tu perfil seguro al instante vinculado a tu cuenta de Google.
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center text-xs text-muted-foreground">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
                >
                  Volver al inicio
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
