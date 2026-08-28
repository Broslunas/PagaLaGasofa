"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export function DownloadImageButton({ shareId }: { shareId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/t/${shareId}/opengraph-image`);
      if (!response.ok) throw new Error("Fetch error");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${shareId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // fallback directo
      const a = document.createElement("a");
      a.href = `/t/${shareId}/opengraph-image`;
      a.download = `ticket-${shareId}.png`;
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="default"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? <Loader2 className="animate-spin" /> : <Download />}
      {loading ? "Generando..." : "Descargar PNG"}
    </Button>
  );
}
