"use client"

import { Loader2, Mail } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { es } from "@/i18n/es"
import { safeNextPath } from "@/lib/auth/redirect"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/client"

type Status = "idle" | "sending" | "sent" | "error"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-4.9H1.300v3.100A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.600V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  )
}

export function LoginForm() {
  const params = useSearchParams()
  const next = safeNextPath(params.get("next"))
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const configured = isSupabaseConfigured()

  const callbackUrl = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  async function signInWithGoogle() {
    setStatus("idle")
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    })
    if (error) setStatus("error")
  }

  async function signInWithEmail(event: FormEvent) {
    event.preventDefault()
    setStatus("sending")
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    })
    setStatus(error ? "error" : "sent")
  }

  if (!configured) {
    return <p className="text-sm text-muted-foreground">{es.auth.notConfigured}</p>
  }

  return (
    <div className="space-y-5">
      <Button variant="outline" size="lg" className="w-full" onClick={signInWithGoogle}>
        <GoogleIcon />
        {es.auth.google}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {es.auth.or}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={signInWithEmail} className="space-y-3">
        <Label htmlFor="email">{es.auth.email}</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={es.auth.emailPlaceholder}
          className="h-10 text-base"
        />
        <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
          {status === "sending" ? <Loader2 className="animate-spin" /> : <Mail />}
          {status === "sending" ? es.auth.sending : es.auth.sendLink}
        </Button>
      </form>

      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {status === "sent" && <span className="text-success">{es.auth.linkSent}</span>}
        {status === "error" && <span className="text-destructive">{es.auth.genericError}</span>}
      </p>
    </div>
  )
}
