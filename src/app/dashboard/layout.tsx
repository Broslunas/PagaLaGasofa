import { Suspense } from "react"

import { requireUser } from "@/lib/auth/session"

async function Guard({ children }: { children: React.ReactNode }) {
  await requireUser("/dashboard")
  return children
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<div className="flex-1" aria-busy />}>
      <Guard>{children}</Guard>
    </Suspense>
  )
}
