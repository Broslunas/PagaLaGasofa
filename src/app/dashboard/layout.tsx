import { Suspense } from "react"

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { requireUser } from "@/lib/auth/session"

async function Guard({ children }: { children: React.ReactNode }) {
  await requireUser("/dashboard")
  return children
}

function PageSkeleton() {
  return <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <DashboardNav />
      </aside>
      <div className="min-w-0">
        <Suspense fallback={<PageSkeleton />}>
          <Guard>{children}</Guard>
        </Suspense>
      </div>
    </div>
  )
}
