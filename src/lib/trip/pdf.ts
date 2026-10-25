import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

import { formatCents, formatNumber } from "@/lib/format"

import { FUEL_INFO, type FuelType } from "./fuel"
import { shortPlace } from "./share"

export interface PdfTicket {
  title: string
  stops: { label: string }[]
  geometry: [number, number][]
  distanceKm: number
  isRoundTrip: boolean
  fuelType: FuelType
  energyUnits: number
  energyCents: number
  tollsCents: number
  extras: { label: string; amountCents: number }[]
  totalCents: number
  co2Kg: number
  createdAt: Date
  url: string
  passengers: { name: string; amountCents: number; hasPaid: boolean; isDriver: boolean }[]
  qrPng: Uint8Array
}

const GREEN = rgb(0.078, 0.533, 0.416)
const AMBER = rgb(0.96, 0.72, 0.11)
const INK = rgb(0.1, 0.13, 0.13)
const MUTED = rgb(0.4, 0.44, 0.44)
const LINE = rgb(0.88, 0.89, 0.87)

/** Las fuentes estándar de PDF solo cubren WinAnsi; lo demás se sustituye por «?». */
function makeSafe(font: PDFFont) {
  const supported = new Set(font.getCharacterSet())
  return (text: string) =>
    [...text.normalize("NFC")].map((ch) => (supported.has(ch.codePointAt(0)!) ? ch : "?")).join("")
}

function truncate(font: PDFFont, text: string, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}

/** Dibuja la ruta como esquema vectorial (sin teselas de mapa) dentro de un recuadro. */
function drawRoute(page: PDFPage, geometry: [number, number][], box: { x: number; y: number; w: number; h: number }) {
  page.drawRectangle({ x: box.x, y: box.y, width: box.w, height: box.h, color: rgb(0.95, 0.96, 0.94), borderColor: LINE, borderWidth: 1 })
  if (geometry.length < 2) return

  const lats = geometry.map((p) => p[1])
  const lngs = geometry.map((p) => p[0])
  const midLat = ((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180)
  const kx = Math.cos(midLat)
  const minX = Math.min(...lngs) * kx
  const spanX = Math.max((Math.max(...lngs) - Math.min(...lngs)) * kx, 1e-6)
  const minY = Math.min(...lats)
  const spanY = Math.max(Math.max(...lats) - minY, 1e-6)

  const pad = 22
  const scale = Math.min((box.w - pad * 2) / spanX, (box.h - pad * 2) / spanY)
  const offX = box.x + (box.w - spanX * scale) / 2
  const offY = box.y + (box.h - spanY * scale) / 2
  const project = ([lng, lat]: [number, number]) => ({ x: offX + (lng * kx - minX) * scale, y: offY + (lat - minY) * scale })

  const pts = geometry.map(project)
  for (let i = 0; i < pts.length - 1; i++) {
    page.drawLine({ start: pts[i], end: pts[i + 1], thickness: 3.2, color: GREEN, lineCap: 1 })
  }
  const marker = (p: { x: number; y: number }, color: ReturnType<typeof rgb>) => {
    page.drawCircle({ x: p.x, y: p.y, size: 6, color, borderColor: rgb(1, 1, 1), borderWidth: 2 })
  }
  marker(pts[0], GREEN)
  marker(pts[pts.length - 1], AMBER)
}

export async function buildTicketPdf(t: PdfTicket): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(t.title)
  doc.setProducer("PagaLaGasofa")
  const page = doc.addPage([595.28, 841.89])
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const safe = makeSafe(regular)

  const M = 40
  const W = page.getWidth() - M * 2
  let y = page.getHeight()

  // Cabecera
  page.drawRectangle({ x: 0, y: y - 86, width: page.getWidth(), height: 86, color: GREEN })
  page.drawRectangle({ x: page.getWidth() - 120, y: y - 86, width: 120, height: 86, color: AMBER })
  page.drawText("PagaLaGasofa", { x: M, y: y - 34, size: 12, font: bold, color: rgb(1, 1, 1) })
  page.drawText(truncate(bold, safe(t.title), 22, W - 100), { x: M, y: y - 62, size: 22, font: bold, color: rgb(1, 1, 1) })
  y -= 86 + 28

  // Resumen de la ruta
  const places = t.stops.map((s) => shortPlace(s.label))
  const route = places.length > 2 ? `${places[0]} → ${places.length - 2} parada(s) → ${places[places.length - 1]}` : `${places[0]} → ${places[1]}`
  page.drawText(truncate(regular, safe(route.replaceAll("→", "->")), 12, W), { x: M, y, size: 12, font: regular, color: INK })
  y -= 16
  const date = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(t.createdAt)
  page.drawText(safe(`${formatNumber(t.distanceKm)} km${t.isRoundTrip ? " (ida y vuelta)" : ""}  ·  ${date}`), {
    x: M, y, size: 10, font: regular, color: MUTED,
  })
  y -= 14

  const mapH = 190
  drawRoute(page, t.geometry, { x: M, y: y - mapH, w: W, h: mapH })
  y -= mapH + 26

  // Total
  page.drawText("TOTAL DEL VIAJE", { x: M, y, size: 9, font: bold, color: MUTED })
  y -= 28
  page.drawText(safe(formatCents(t.totalCents)), { x: M, y, size: 28, font: bold, color: INK })
  y -= 22

  const line = (label: string, amount: string) => {
    page.drawText(truncate(regular, safe(label), 10, W - 90), { x: M, y, size: 10, font: regular, color: MUTED })
    const w = regular.widthOfTextAtSize(safe(amount), 10)
    page.drawText(safe(amount), { x: M + W - w, y, size: 10, font: regular, color: INK })
    y -= 15
  }
  const unit = FUEL_INFO[t.fuelType].unit
  line(`${FUEL_INFO[t.fuelType].label} (${formatNumber(t.energyUnits)} ${unit})`, formatCents(t.energyCents))
  if (t.tollsCents > 0) line("Peajes", formatCents(t.tollsCents))
  t.extras.forEach((e) => line(e.label, formatCents(e.amountCents)))
  y -= 14

  // Pasajeros
  page.drawText("CADA UNO PAGA", { x: M, y, size: 9, font: bold, color: MUTED })
  y -= 8
  page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 1, color: LINE })
  y -= 18
  for (const p of t.passengers.slice(0, 14)) {
    const status = p.isDriver ? "Conductor" : p.amountCents === 0 ? "" : p.hasPaid ? "Pagado" : "Pendiente"
    page.drawText(truncate(regular, safe(p.name), 12, W - 220), { x: M, y, size: 12, font: regular, color: INK })
    page.drawText(status, { x: M + W - 190, y, size: 10, font: regular, color: p.hasPaid ? GREEN : MUTED })
    const amount = safe(formatCents(p.amountCents))
    page.drawText(amount, { x: M + W - bold.widthOfTextAtSize(amount, 12), y, size: 12, font: bold, color: INK })
    y -= 20
    page.drawLine({ start: { x: M, y: y + 14 }, end: { x: M + W, y: y + 14 }, thickness: 0.5, color: LINE })
  }

  // Pie: QR y enlace
  const qr = await doc.embedPng(t.qrPng)
  const qrSize = 84
  page.drawImage(qr, { x: M, y: M, width: qrSize, height: qrSize })
  page.drawText("Escanea para ver el ticket al día", { x: M + qrSize + 14, y: M + 52, size: 11, font: bold, color: INK })
  page.drawText(truncate(regular, t.url, 9, W - qrSize - 14), { x: M + qrSize + 14, y: M + 36, size: 9, font: regular, color: MUTED })
  page.drawText(safe(`Emisiones estimadas: ${formatNumber(t.co2Kg)} kg de CO2`), {
    x: M + qrSize + 14, y: M + 14, size: 9, font: regular, color: MUTED,
  })

  return doc.save()
}
