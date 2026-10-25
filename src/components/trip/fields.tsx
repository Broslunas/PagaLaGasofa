"use client"

import { useId } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string | null
  children: (props: { id: string; describedBy?: string }) => React.ReactNode
  className?: string
}) {
  const id = useId()
  const describedBy = error || hint ? `${id}-d` : undefined
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, describedBy })}
      {(error || hint) && (
        <p id={describedBy} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

/** Campo numérico con coma o punto decimal y sufijo de unidad. 16 px para evitar el zoom de iOS. */
export function DecimalInput({
  id,
  value,
  onChange,
  suffix,
  placeholder,
  describedBy,
  invalid,
  className,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  suffix?: string
  placeholder?: string
  describedBy?: string
  invalid?: boolean
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          const v = e.target.value
          if (/^[0-9]*[.,]?[0-9]*$/.test(v)) onChange(v)
        }}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-card px-3 text-base tabular-nums outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive",
          suffix && "pr-14",
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  )
}

export function TextInput(props: React.ComponentProps<"input">) {
  return (
    <input
      autoComplete="off"
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-card px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        props.className,
      )}
    />
  )
}
