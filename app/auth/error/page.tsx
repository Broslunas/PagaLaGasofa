import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Códigos que puede enviar Auth.js en ?error=. Ver:
// node_modules/next-auth/lib/pages/error.js
const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Hay un problema con la configuración del servidor de autenticación. Contacta con soporte.",
  AccessDenied: "No tienes permiso para acceder a esta cuenta.",
  Verification: "El enlace de verificación ha caducado o ya se ha usado.",
  OAuthSignin: "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
  OAuthCallback: "Error al procesar la respuesta de Google. Inténtalo de nuevo.",
  OAuthCreateAccount: "No se pudo crear la cuenta a partir de tu perfil de Google.",
  EmailCreateAccount: "No se pudo crear la cuenta con ese correo.",
  Callback: "Error durante el proceso de autenticación.",
  OAuthAccountNotLinked: "Ese correo ya está asociado a otra cuenta. Inicia sesión con el proveedor original.",
  SessionRequired: "Debes iniciar sesión para acceder a esta página.",
  Default: "Ha ocurrido un error inesperado al iniciar sesión.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = (error && ERROR_MESSAGES[error]) || ERROR_MESSAGES.Default;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              No se pudo iniciar sesión
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>

          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button size="lg" render={<Link href="/login" />} nativeButton={false}>
              Volver a intentarlo
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/" className="inline-flex items-center gap-1.5" />}
              nativeButton={false}
            >
              Ir al inicio
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
