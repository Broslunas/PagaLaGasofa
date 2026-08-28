"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginButton({ stacked = false }: { stacked?: boolean }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div
        className={
          stacked
            ? "h-10 w-full animate-pulse rounded-md bg-muted/60"
            : "h-9 w-24 animate-pulse rounded-md bg-muted/60"
        }
      />
    );
  }

  if (session?.user) {
    const userImage = session.user.image;
    const userName = session.user.name || "Usuario";
    const userInitial = userName.charAt(0).toUpperCase();

    if (stacked) {
      return (
        <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/30 p-2.5">
          <div className="flex items-center gap-2.5 px-1 py-1">
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={32}
                height={32}
                className="rounded-full ring-1 ring-border"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {userInitial || <User className="h-4 w-4" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{userName}</p>
              {session.user.email && (
                <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 pt-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/90 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Mi panel
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {userImage ? (
            <Image
              src={userImage}
              alt={userName}
              width={22}
              height={22}
              className="rounded-full ring-1 ring-border"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {userInitial}
            </div>
          )}
          <span className="max-w-[120px] truncate">{userName}</span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Cerrar sesión"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className={stacked ? "w-full gap-2" : "gap-2"}
      onClick={() => signIn("google")}
    >
      <LogIn className="h-4 w-4" />
      Iniciar sesión
    </Button>
  );
}
