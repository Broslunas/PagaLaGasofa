"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton({ shareId }: { shareId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/t/${shareId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" onClick={copy}>
      {copied ? <Check /> : <Copy />}
      {copied ? "Copiado" : "Copiar enlace"}
    </Button>
  );
}
