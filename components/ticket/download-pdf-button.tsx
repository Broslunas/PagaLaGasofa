"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

// PDF generado desde cero en el servidor con pdf-lib (app/t/[shareId]/pdf/route.ts):
// un diseño propio dibujado a vectores, no una captura del diálogo de impresión.
export function DownloadPdfButton({ shareId }: { shareId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/t/${shareId}/pdf`);
      if (!response.ok) throw new Error("Fetch error");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${shareId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = `/t/${shareId}/pdf`;
      a.download = `ticket-${shareId}.pdf`;
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <FileText />}
      {loading ? "Generando..." : "Descargar PDF"}
    </Button>
  );
}
