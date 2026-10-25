import type { Metadata } from "next"

import { AccountSettings } from "@/components/dashboard/account-settings"

export const metadata: Metadata = { title: "Ajustes de la cuenta", robots: { index: false } }

export default function AccountSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <AccountSettings />
    </div>
  )
}
