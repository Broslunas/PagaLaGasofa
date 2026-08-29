// Generación de PDF "de verdad": dibujado con pdf-lib (vectores + texto),
// no una captura ni el print stylesheet de la página. Vive aparte de
// app/t/[shareId]/page.tsx a propósito — el diseño en pantalla y el del PDF
// pueden divergir libremente.
import {
  PDFDocument,
  StandardFonts,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
  LineCapStyle,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";
import type { Trip } from "@prisma/client";
import { buildStaticMap, getRoutePoints } from "@/lib/static-map";

const WIDTH = 460;
const MARGIN = 28;
const CONTENT_W = WIDTH - MARGIN * 2;
// Lienzo de trabajo provisional: se dibuja todo de arriba a abajo sin saber
// el alto final de antemano, y al terminar se recorta (setSize +
// translateContent) al alto realmente usado. El valor de partida es
// irrelevante para el resultado — solo debe ser mayor que cualquier ticket
// razonable para no dibujar en coordenadas negativas.
const MAX_HEIGHT = 3000;

const ORANGE = rgb(0.918, 0.345, 0.047);
const ORANGE_BG = rgb(0.996, 0.929, 0.882);
const INK = rgb(0.09, 0.09, 0.11);
const GRAY = rgb(0.44, 0.44, 0.47);
const BORDER = rgb(0.85, 0.85, 0.87);
const ROW_ALT = rgb(0.97, 0.97, 0.98);
const GREEN = rgb(0.13, 0.55, 0.13);
const AMBER = rgb(0.72, 0.42, 0.04);
const WHITE = rgb(1, 1, 1);

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(attempt, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

const money = (n: number) => `${n.toFixed(2)} €`;

export async function buildTicketPdf(trip: Trip, shareId: string, ticketUrl: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([WIDTH, MAX_HEIGHT]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const qrPng = await QRCode.toBuffer(ticketUrl, { type: "png", margin: 1, width: 240 });
  const qrImage = await pdfDoc.embedPng(qrPng);

  let y = MAX_HEIGHT;

  // ---- Cabecera de marca ----
  const HEADER_H = 76;
  page.drawRectangle({ x: 0, y: y - HEADER_H, width: WIDTH, height: HEADER_H, color: ORANGE });
  page.drawText("PagaLaGasofa", { x: MARGIN, y: y - 34, size: 20, font: bold, color: WHITE });
  page.drawText("Reparte la gasofa, no la amistad", {
    x: MARGIN,
    y: y - 52,
    size: 9,
    font: regular,
    color: rgb(1, 1, 1),
    opacity: 0.85,
  });
  const ticketLabel = `#${shareId.slice(-8).toUpperCase()}`;
  const printedAt = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(
    trip.createdAt
  );
  page.drawText(ticketLabel, {
    x: WIDTH - MARGIN - bold.widthOfTextAtSize(ticketLabel, 13),
    y: y - 32,
    size: 13,
    font: bold,
    color: WHITE,
  });
  page.drawText(printedAt, {
    x: WIDTH - MARGIN - regular.widthOfTextAtSize(printedAt, 9),
    y: y - 47,
    size: 9,
    font: regular,
    color: rgb(1, 1, 1),
    opacity: 0.85,
  });
  y -= HEADER_H + 24;

  // ---- Título / ruta ----
  if (trip.title) {
    const titleLines = wrapText(bold, trip.title, 17, CONTENT_W);
    for (const line of titleLines) {
      page.drawText(line, { x: MARGIN, y, size: 17, font: bold, color: INK });
      y -= 21;
    }
    y -= 2;
  }
  y = drawRoute(page, regular, bold, trip.origin, trip.destination, y);
  y -= 10;

  // ---- Mapa de la ruta (mismos tiles OSM que la imagen de compartir) ----
  const MAP_H = 190;
  const routePoints = getRoutePoints(trip);
  const staticMap = routePoints.length > 0 ? await buildStaticMap(routePoints, CONTENT_W, MAP_H) : null;
  page.drawText("MAPA DE RUTA", { x: MARGIN, y, size: 9, font: bold, color: GRAY });
  y -= 14;
  const mapTop = y;
  page.drawRectangle({
    x: MARGIN,
    y: mapTop - MAP_H,
    width: CONTENT_W,
    height: MAP_H,
    color: rgb(0.97, 0.97, 0.98),
    borderColor: BORDER,
    borderWidth: 1,
  });

  if (staticMap) {
    // Recorta los tiles/ruta al recuadro: pdf-lib no tiene una API de alto
    // nivel para esto, así que empujamos los operadores PDF de clip a mano.
    page.pushOperators(pushGraphicsState(), rectangle(MARGIN, mapTop - MAP_H, CONTENT_W, MAP_H), clip(), endPath());

    for (const t of staticMap.tiles) {
      const tileImg = await pdfDoc.embedPng(Buffer.from(t.dataUrl.split(",")[1], "base64"));
      // t.left/t.top son offsets en píxeles con origen arriba-izquierda del
      // lienzo (eje Y hacia abajo); drawImage espera la esquina inferior
      // izquierda en el espacio de página de pdf-lib (eje Y hacia arriba).
      page.drawImage(tileImg, { x: MARGIN + t.left, y: mapTop - t.top - 256, width: 256, height: 256 });
    }
    // Velo claro para integrar el tile con el resto del ticket
    page.drawRectangle({ x: MARGIN, y: mapTop - MAP_H, width: CONTENT_W, height: MAP_H, color: WHITE, opacity: 0.12 });

    // Downsample para no saturar el path SVG en rutas con miles de puntos
    const linePoints = routePoints
      .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 200)) === 0)
      .map((p) => staticMap.project(p.lat, p.lon));
    const svgPath = `M ${linePoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
    // drawSvgPath usa un sistema Y-abajo relativo a (x,y); con (MARGIN, mapTop)
    // como ancla coincide con el mismo origen que usamos para los tiles.
    const routeOpts = { x: MARGIN, y: mapTop, borderLineCap: LineCapStyle.Round } as const;
    page.drawSvgPath(svgPath, { ...routeOpts, borderColor: rgb(0.486, 0.176, 0.07), borderWidth: 7 });
    page.drawSvgPath(svgPath, { ...routeOpts, borderColor: ORANGE, borderWidth: 4 });

    const originPt = staticMap.project(routePoints[0].lat, routePoints[0].lon);
    const destPt = staticMap.project(routePoints[routePoints.length - 1].lat, routePoints[routePoints.length - 1].lon);
    page.drawCircle({ x: MARGIN + originPt.x, y: mapTop - originPt.y, size: 5, color: GREEN, borderColor: WHITE, borderWidth: 1.5 });
    page.drawCircle({ x: MARGIN + destPt.x, y: mapTop - destPt.y, size: 5, color: rgb(0.86, 0.15, 0.15), borderColor: WHITE, borderWidth: 1.5 });

    page.pushOperators(popGraphicsState());
    // El borde de arriba queda medio tapado por los tiles (el clip solo deja
    // fuera la mitad exterior del trazo); lo repintamos encima, sin relleno,
    // para que el recuadro se vea nítido.
    page.drawRectangle({ x: MARGIN, y: mapTop - MAP_H, width: CONTENT_W, height: MAP_H, borderColor: BORDER, borderWidth: 1.5 });
  } else {
    page.drawText("Mapa no disponible para este viaje", {
      x: MARGIN + 12,
      y: mapTop - MAP_H / 2 - 4,
      size: 9.5,
      font: regular,
      color: GRAY,
    });
  }
  y = mapTop - MAP_H - 18;

  // ---- Paradas intermedias ----
  if (trip.waypoints.length > 0) {
    page.drawText("PARADAS", { x: MARGIN, y, size: 9, font: bold, color: GRAY });
    y -= 14;
    trip.waypoints.forEach((w, i) => {
      const label = w.label || `${w.lat.toFixed(4)}, ${w.lon.toFixed(4)}`;
      for (const line of wrapText(regular, `${i + 1}. ${label}`, 10, CONTENT_W)) {
        page.drawText(line, { x: MARGIN, y, size: 10, font: regular, color: INK });
        y -= 13;
      }
    });
    y -= 8;
  }

  // ---- Métricas: distancia / consumo / precio ----
  const metrics = [
    { label: "Distancia", value: `${trip.distanceKm.toFixed(1)} km${trip.isRoundTrip ? " (I/V)" : ""}` },
    { label: "Consumo", value: `${trip.consumptionL100.toFixed(1)} l/100km` },
    { label: "Combustible", value: `${trip.fuelPricePerLiter.toFixed(3)} €/L` },
  ];
  const boxGap = 8;
  const boxW = (CONTENT_W - boxGap * (metrics.length - 1)) / metrics.length;
  const boxH = 44;
  metrics.forEach((m, i) => {
    const x = MARGIN + i * (boxW + boxGap);
    page.drawRectangle({
      x,
      y: y - boxH,
      width: boxW,
      height: boxH,
      color: rgb(0.97, 0.97, 0.98),
      borderColor: BORDER,
      borderWidth: 1,
    });
    page.drawText(m.label.toUpperCase(), { x: x + 8, y: y - 16, size: 7.5, font: bold, color: GRAY });
    page.drawText(m.value, { x: x + 8, y: y - 33, size: 11, font: bold, color: INK });
  });
  y -= boxH + 18;

  // ---- Desglose de coste ----
  page.drawText("DESGLOSE", { x: MARGIN, y, size: 9, font: bold, color: GRAY });
  y -= 16;
  const fuelCost = trip.totalCost - trip.tollsCost - trip.extraCosts;
  const lines: [string, string][] = [["Combustible", money(fuelCost)]];
  if (trip.tollsCost > 0) lines.push(["Peajes", money(trip.tollsCost)]);
  if (trip.extraCosts > 0) lines.push(["Otros gastos", money(trip.extraCosts)]);
  for (const [label, value] of lines) {
    page.drawText(label, { x: MARGIN, y, size: 11, font: regular, color: INK });
    page.drawText(value, { x: WIDTH - MARGIN - regular.widthOfTextAtSize(value, 11), y, size: 11, font: regular, color: INK });
    y -= 16;
  }
  page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: WIDTH - MARGIN, y: y + 4 }, thickness: 1, color: BORDER });
  y -= 10;

  const totalLabel = `Total (${trip.passengers.length} pasajero${trip.passengers.length === 1 ? "" : "s"})`;
  page.drawText(totalLabel, { x: MARGIN, y, size: 12, font: bold, color: INK });
  const totalValue = money(trip.totalCost);
  page.drawText(totalValue, {
    x: WIDTH - MARGIN - bold.widthOfTextAtSize(totalValue, 14),
    y: y - 1,
    size: 14,
    font: bold,
    color: INK,
  });
  y -= 20;
  const perPaxLabel = "Por persona";
  page.drawText(perPaxLabel, { x: MARGIN, y, size: 10, font: regular, color: GRAY });
  const perPaxValue = money(trip.costPerPassenger);
  page.drawText(perPaxValue, {
    x: WIDTH - MARGIN - bold.widthOfTextAtSize(perPaxValue, 12),
    y,
    size: 12,
    font: bold,
    color: ORANGE,
  });
  y -= 26;

  // ---- El conductor recupera ----
  const driverH = 34;
  page.drawRectangle({ x: MARGIN, y: y - driverH, width: CONTENT_W, height: driverH, color: ORANGE_BG });
  page.drawText("El conductor recupera", { x: MARGIN + 10, y: y - 22, size: 10.5, font: bold, color: ORANGE });
  const driverValue = money(trip.driverReceives);
  page.drawText(driverValue, {
    x: WIDTH - MARGIN - 10 - bold.widthOfTextAtSize(driverValue, 13),
    y: y - 23,
    size: 13,
    font: bold,
    color: ORANGE,
  });
  y -= driverH + 22;

  // ---- Pasajeros ----
  const stopLabels = ["Origen", ...trip.waypoints.map((_, i) => `Parada ${i + 1}`), "Destino"];
  page.drawText(`PASAJEROS & BIZUMS (${trip.passengers.length})`, { x: MARGIN, y, size: 9, font: bold, color: GRAY });
  y -= 16;
  trip.passengers.forEach((p, i) => {
    const hasStops = trip.waypoints.length > 0 && p.pickupStop != null && p.dropoffStop != null;
    const stopText = hasStops ? `${stopLabels[p.pickupStop!]} › ${stopLabels[p.dropoffStop!]}` : null;
    const amountText = money(p.amount);
    const rightW = regular.widthOfTextAtSize(amountText, 11) + 62;
    const nameLines = wrapText(bold, p.name, 11, CONTENT_W - rightW);
    const rowH = Math.max(24, nameLines.length * 13 + (stopText ? 12 : 0) + 8);

    if (i % 2 === 1) page.drawRectangle({ x: MARGIN, y: y - rowH, width: CONTENT_W, height: rowH, color: ROW_ALT });

    let ny = y - 15;
    for (const line of nameLines) {
      page.drawText(line, { x: MARGIN + 8, y: ny, size: 11, font: bold, color: INK });
      ny -= 13;
    }
    if (stopText) {
      page.drawText(stopText, { x: MARGIN + 8, y: ny, size: 8.5, font: regular, color: GRAY });
    }

    page.drawText(amountText, {
      x: WIDTH - MARGIN - 8 - regular.widthOfTextAtSize(amountText, 11),
      y: y - 15,
      size: 11,
      font: bold,
      color: INK,
    });
    const status = p.hasPaid ? "Pagado" : "Pendiente";
    const statusColor = p.hasPaid ? GREEN : AMBER;
    page.drawText(status, {
      x: WIDTH - MARGIN - 8 - regular.widthOfTextAtSize(status, 8),
      y: y - 28,
      size: 8,
      font: bold,
      color: statusColor,
    });

    y -= rowH;
  });
  y -= 14;

  // ---- Pie: QR + enlace ----
  const qrSize = 64;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: WIDTH - MARGIN, y }, thickness: 1, color: BORDER });
  y -= 16;
  page.drawImage(qrImage, { x: MARGIN, y: y - qrSize, width: qrSize, height: qrSize });
  const linkText = ticketUrl.replace(/^https?:\/\//, "");
  page.drawText("Escanea para ver el ticket en vivo", {
    x: MARGIN + qrSize + 14,
    y: y - 22,
    size: 9.5,
    font: bold,
    color: INK,
  });
  page.drawText(linkText, { x: MARGIN + qrSize + 14, y: y - 36, size: 8.5, font: regular, color: ORANGE });
  page.drawText("Marca pagos y edita el viaje en el enlace de arriba.", {
    x: MARGIN + qrSize + 14,
    y: y - 50,
    size: 8,
    font: regular,
    color: GRAY,
  });
  y -= qrSize + 10;

  // Recorta el alto sobrante: todo se dibujó desde arriba con un lienzo de
  // sobra, así que el contenido real queda entre `y` y MAX_HEIGHT.
  const usedHeight = MAX_HEIGHT - y + MARGIN;
  page.setSize(WIDTH, usedHeight);
  page.translateContent(0, -y + MARGIN);

  return pdfDoc.save();
}

function drawRoute(page: PDFPage, regular: PDFFont, bold: PDFFont, origin: string, destination: string, y: number) {
  const stops: [string, string][] = [
    ["Origen", origin],
    ["Destino", destination],
  ];
  for (const [label, address] of stops) {
    page.drawText(label.toUpperCase(), { x: MARGIN, y, size: 8, font: bold, color: GRAY });
    y -= 12;
    for (const line of wrapText(regular, address, 11, CONTENT_W)) {
      page.drawText(line, { x: MARGIN, y, size: 11, font: regular, color: INK });
      y -= 14;
    }
    y -= 4;
  }
  return y;
}
