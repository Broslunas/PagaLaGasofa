import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

import { formatCents, formatNumber } from "@/lib/format"

import type { MonthRow } from "./series"

export interface ReportTrip {
  date: string
  title: string
  km: number
  totalCents: number
  pendingCents: number
}

export interface ReportData {
  year: number
  name: string
  months: MonthRow[]
  trips: ReportTrip[]
  totals: { trips: number; km: number; spendCents: number; co2Kg: number; savingsCents: number; pendingCents: number }
}

const GREEN = rgb(0.078, 0.533, 0.416)
const INK = rgb(0.1, 0.13, 0.13)
const MUTED = rgb(0.4, 0.44, 0.44)
const LINE = rgb(0.88, 0.89, 0.87)
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

const safeText = (font: PDFFont) => {
  const ok = new Set(font.getCharacterSet())
  return (t: string) => [...t.normalize("NFC")].map((c) => (ok.has(c.codePointAt(0)!) ? c : "?")).join("")
}

function truncate(font: PDFFont, text: string, size: number, max: number) {
  if (font.widthOfTextAtSize(text, size) <= max) return text
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > max) t = t.slice(0, -1)
  return `${t}…`
}

/** Informe anual en PDF: cifras, desglose por meses y listado de viajes (varias páginas si hace falta). */
export async function buildYearReport(data: ReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Informe ${data.year} · PagaLaGasofa`)
  doc.setProducer("PagaLaGasofa")
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const safe = safeText(regular)
  const M = 40
  const W = 595.28 - M * 2

  let page: PDFPage
  let y = 0
  const newPage = () => {
    page = doc.addPage([595.28, 841.89])
    y = page.getHeight() - M
  }
  const right = (text: string, x: number, font: PDFFont, size: number, color = INK) =>
    page.drawText(text, { x: x - font.widthOfTextAtSize(text, size), y, size, font, color })

  newPage()
  page!.drawRectangle({ x: 0, y: page!.getHeight() - 78, width: page!.getWidth(), height: 78, color: GREEN })
  page!.drawText("PagaLaGasofa", { x: M, y: page!.getHeight() - 32, size: 12, font: bold, color: rgb(1, 1, 1) })
  page!.drawText(`Informe de ${data.year}`, { x: M, y: page!.getHeight() - 58, size: 22, font: bold, color: rgb(1, 1, 1) })
  y = page!.getHeight() - 78 - 26
  page!.drawText(truncate(regular, safe(data.name), 11, W), { x: M, y, size: 11, font: regular, color: MUTED })
  y -= 28

  // Cifras
  const cells: [string, string][] = [
    ["Viajes", String(data.totals.trips)],
    ["Distancia", `${formatNumber(data.totals.km)} km`],
    ["Gastado", formatCents(data.totals.spendCents)],
    ["Ahorro estimado", formatCents(data.totals.savingsCents)],
    ["CO2 emitido", `${formatNumber(data.totals.co2Kg)} kg`],
    ["Pendiente de cobro", formatCents(data.totals.pendingCents)],
  ]
  const cw = W / 3
  cells.forEach(([label, value], i) => {
    const cx = M + (i % 3) * cw
    const cy = y - Math.floor(i / 3) * 46
    page!.drawText(safe(label.toUpperCase()), { x: cx, y: cy, size: 8, font: bold, color: MUTED })
    page!.drawText(safe(value), { x: cx, y: cy - 20, size: 16, font: bold, color: INK })
  })
  y -= 46 * 2 + 14

  // Meses
  page!.drawText("POR MESES", { x: M, y, size: 9, font: bold, color: MUTED })
  y -= 8
  page!.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 1, color: LINE })
  y -= 14
  const cols = { mes: M, viajes: M + 150, km: M + 250, gasto: M + 360, ahorro: M + W }
  page!.drawText("Mes", { x: cols.mes, y, size: 9, font: bold, color: MUTED })
  right("Viajes", cols.viajes + 40, bold, 9, MUTED)
  right("Km", cols.km + 50, bold, 9, MUTED)
  right("Gasto", cols.gasto + 70, bold, 9, MUTED)
  right("Ahorro", cols.ahorro, bold, 9, MUTED)
  y -= 14
  for (const m of data.months) {
    const label = `${MONTHS[Number(m.month.slice(5)) - 1]} ${m.month.slice(0, 4)}`
    page!.drawText(label, { x: cols.mes, y, size: 10, font: regular, color: m.trips ? INK : MUTED })
    right(String(m.trips), cols.viajes + 40, regular, 10, m.trips ? INK : MUTED)
    right(formatNumber(m.km), cols.km + 50, regular, 10, m.trips ? INK : MUTED)
    right(safe(formatCents(m.spendCents)), cols.gasto + 70, regular, 10, m.trips ? INK : MUTED)
    right(safe(formatCents(m.savingsCents)), cols.ahorro, regular, 10, m.trips ? INK : MUTED)
    y -= 15
  }

  // Viajes
  y -= 14
  const header = () => {
    page!.drawText("VIAJES", { x: M, y, size: 9, font: bold, color: MUTED })
    y -= 8
    page!.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 1, color: LINE })
    y -= 14
  }
  if (y < 120) newPage()
  header()
  if (data.trips.length === 0) page!.drawText("Sin viajes en este año.", { x: M, y, size: 10, font: regular, color: MUTED })
  for (const t of data.trips) {
    if (y < M + 20) {
      newPage()
      header()
    }
    page!.drawText(t.date, { x: M, y, size: 9, font: regular, color: MUTED })
    page!.drawText(truncate(regular, safe(t.title), 10, 260), { x: M + 70, y, size: 10, font: regular, color: INK })
    right(`${formatNumber(t.km)} km`, M + 410, regular, 9, MUTED)
    right(safe(formatCents(t.totalCents)), M + W, bold, 10)
    y -= 15
  }

  return doc.save()
}
