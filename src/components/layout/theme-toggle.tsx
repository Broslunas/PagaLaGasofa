"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { es } from "@/i18n/es"

const order = ["system", "light", "dark"] as const
const icons = { system: Monitor, light: Sun, dark: Moon }
const labels = { system: es.theme.system, light: es.theme.light, dark: es.theme.dark }

const subscribe = () => () => {}

export function ThemeToggle() {
  const { theme = "system", setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const current = mounted && (theme === "light" || theme === "dark") ? theme : "system"
  const next = order[(order.indexOf(current) + 1) % order.length]
  const Icon = icons[current]

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`${es.theme.toggle}: ${labels[current]}`}
      title={`${es.theme.toggle}: ${labels[current]}`}
    >
      <Icon />
    </Button>
  )
}
