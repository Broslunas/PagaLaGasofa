"use client"

import { Check, Copy, MessageCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const text = `${title}: sigue mi ubicación en directo → ${url}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copia el enlace:", url)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={copy}>
        {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar enlace"}
      </Button>
      <Button asChild variant="outline">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle /> WhatsApp
        </a>
      </Button>
    </div>
  )
}
