"use client"

import { Button } from "@/components/ui/button"

import { openCookiePreferences } from "./consent-store"

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="outline" className={className} onClick={openCookiePreferences}>
      Preferencias de cookies
    </Button>
  )
}
