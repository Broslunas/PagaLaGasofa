"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
          <Image src="/logo.svg" alt="PagaLaGasofa" width={28} height={28} className="rounded-lg shadow-sm" />
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            PagaLaGasofa
          </span>
        </Link>

        <nav className="hidden items-center gap-4 sm:flex">
          <Link
            href="/viaje"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Viaje
          </Link>
          <Link
            href="/gasolineras"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Gasolineras
          </Link>
          <Link
            href="/app"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            App
          </Link>
          <ThemeToggle />
          <NotificationBell />
          <LoginButton />
        </nav>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open && (
        <nav className="absolute inset-x-0 top-full flex flex-col gap-1 border-t border-border/50 bg-background/95 px-2 py-3 shadow-lg backdrop-blur-md sm:hidden">
          <Link
            href="/viaje"
            className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Viaje
          </Link>
          <Link
            href="/gasolineras"
            className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Gasolineras
          </Link>
          <Link
            href="/app"
            className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            App
          </Link>
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-sm font-medium text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-sm font-medium text-muted-foreground">Notificaciones</span>
            <NotificationBell />
          </div>
          <div className="mt-1 border-t border-border/50 pt-3">
            <LoginButton stacked />
          </div>
        </nav>
      )}
    </header>
  );
}
