"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LoginButton({ stacked = false }: { stacked?: boolean }) {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session?.user) {
    if (stacked) {
      return (
        <div className="flex flex-col gap-2">
          <p className="truncate px-2 text-xs text-muted-foreground">{session.user.name}</p>
          <Link
            href="/dashboard"
            className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
          >
            Mi panel
          </Link>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm font-medium hover:underline">
          Mi panel
        </Link>
        <Button type="button" variant="outline" size="sm" onClick={() => signOut()}>
          Cerrar sesión ({session.user.name})
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className={stacked ? "w-full" : undefined}
      onClick={() => signIn("google")}
    >
      Iniciar sesión
    </Button>
  );
}
