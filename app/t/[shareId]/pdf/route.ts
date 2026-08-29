import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTicketPdf } from "@/lib/pdf-ticket";

export async function GET(_req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const trip = await prisma.trip.findUnique({ where: { shareId } });
  if (!trip) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

  const originUrl = process.env.NEXTAUTH_URL || "https://pagalagasofa.broslunas.com";
  const pdfBytes = await buildTicketPdf(trip, shareId, `${originUrl}/t/${shareId}`);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${shareId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
