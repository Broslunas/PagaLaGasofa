"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

// message va antes del link (que se añade con el origin del navegador, para
// evitar desajuste de hidratación si se metiera en el href en SSR).
export function WhatsAppShareButton({
  shareId,
  message,
  compact = false,
}: {
  shareId: string;
  message: string;
  compact?: boolean;
}) {
  function share() {
    const url = `${window.location.origin}/t/${shareId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`, "_blank");
  }

  if (compact) {
    return (
      <Button type="button" variant="ghost" size="icon-xs" onClick={share} title="Recordar por WhatsApp">
        <MessageCircle />
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" onClick={share}>
      <MessageCircle />
      WhatsApp
    </Button>
  );
}
