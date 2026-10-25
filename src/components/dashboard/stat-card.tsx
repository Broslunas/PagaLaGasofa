import { cn } from "@/lib/utils"

export function StatCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "default" | "success" | "warning" }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-heading text-2xl font-semibold tabular-nums", tone === "success" && "text-success", tone === "warning" && "text-foreground")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
