"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session?.user) {
    return (
      <button
        onClick={() => signOut()}
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        Cerrar sesión ({session.user.name})
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
    >
      Iniciar sesión
    </button>
  );
}
