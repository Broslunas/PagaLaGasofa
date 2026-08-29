"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, Route, Heart, BarChart3, Radio, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/vehicles", label: "Vehículos", icon: Car },
  { href: "/dashboard/trips", label: "Viajes", icon: Route },
  { href: "/dashboard/favoritos", label: "Gasolineras Favoritas", icon: Heart },
  { href: "/dashboard/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/dashboard/compartir", label: "Compartir ubicación", icon: Radio },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar p-3 md:flex">
        <NavLinks pathname={pathname} />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
      >
        <Menu />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col gap-1 bg-sidebar p-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="mb-2 self-end text-sidebar-foreground/70"
            >
              <X />
            </button>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
