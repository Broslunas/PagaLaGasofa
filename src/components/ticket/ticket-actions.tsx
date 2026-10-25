"use client"

import { Check, Copy, Download, ExternalLink, Image as ImageIcon, MessageCircle, Share2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

interface Props {
  shareId: string
  url: string
  message: string
  whatsapp: string
  mapsUrl: string
  title: string
}

export function TicketActions({ shareId, url, message, whatsapp, mapsUrl, title }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copia el enlace:", url)
    }
  }

  async function share() {
    try {
      await navigator.share({ title, text: message, url })
    } catch {
      // Cancelado por el usuario o no disponible.
    }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Button variant="outline" onClick={copy}>
        {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar enlace"}
      </Button>
      <Button asChild variant="outline">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer">
          <MessageCircle /> WhatsApp
        </a>
      </Button>
      {canShare && (
        <Button variant="outline" onClick={share}>
          <Share2 /> Compartir
        </Button>
      )}
      <Button asChild variant="outline">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink /> Abrir en Maps
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={`/t/${shareId}/pdf`} download>
          <Download /> PDF
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={`/t/${shareId}/opengraph-image`} download={`ticket-${shareId}.png`}>
          <ImageIcon /> Imagen
        </a>
      </Button>
    </div>
  )
}
