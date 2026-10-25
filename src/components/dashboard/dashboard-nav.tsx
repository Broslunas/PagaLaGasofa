"use client"

import { BarChart3, Car, Heart, LayoutDashboard, Route, Settings, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/viajes", label: "Viajes", icon: Route },
  { href: "/dashboard/deudas", label: "Deudas", icon: Wallet },
  { href: "/dashboard/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/dashboard/vehiculos", label: "Vehículos", icon: Car },
  { href: "/gasolineras/favoritas", label: "Favoritas", icon: Heart },
  { href: "/dashboard/ajustes", label: "Ajustes", icon: Settings },
] as const

export function DashboardNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Mi cuenta" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const active = "exact" in rest ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors",
                  active ? "bg-primary-soft text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
