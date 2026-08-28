"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session?.user) {
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
    <Button type="button" size="sm" onClick={() => signIn("google")}>
      Iniciar sesión
    </Button>
  );
}
