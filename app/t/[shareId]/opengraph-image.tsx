import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { shortenAddress } from "@/lib/format-address";
import { buildStaticMap } from "@/lib/static-map";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MAP_W = 376;
const MAP_H = 260;

export default async function Image({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const trip = await prisma.trip.findUnique({ where: { shareId } });

  if (!trip) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            color: "#71717a",
            background: "#09090b",
          }}
        >
          Ticket no encontrado
        </div>
      ),
      size
    );
  }

  // Generar QR Code en data URL para el ticket web apuntando al dominio oficial
  const originUrl = process.env.NEXTAUTH_URL || "https://pagalagasofa.broslunas.com";
  const ticketUrl = `${originUrl}/t/${shareId}`;
  const qrDataUrl = await QRCode.toDataURL(ticketUrl, {
    margin: 1,
    width: 240,
    color: {
      dark: "#09090b",
      light: "#ffffff",
    },
  });

  const shortOrigin = shortenAddress(trip.origin);
  const shortDest = shortenAddress(trip.destination);

  // Ruta real (carretera OSRM) si la tenemos guardada, si no una línea recta origen->destino
  const geometryPoints: [number, number][] = (() => {
    if (!trip.geometry) return [];
    try {
      return JSON.parse(trip.geometry);
    } catch {
      return [];
    }
  })();

  const hasCoords = trip.originLat != null && trip.originLon != null && trip.destLat != null && trip.destLon != null;
  const mapPoints = hasCoords
    ? geometryPoints.length > 0
      ? geometryPoints.map(([lat, lon]) => ({ lat, lon }))
      : [
          { lat: trip.originLat!, lon: trip.originLon! },
          ...trip.waypoints.map((w) => ({ lat: w.lat, lon: w.lon })),
          { lat: trip.destLat!, lon: trip.destLon! },
        ]
    : [];

  const staticMap = mapPoints.length > 0 ? await buildStaticMap(mapPoints, MAP_W, MAP_H) : null;

  // Simplificamos la polyline para no saturar el SVG en rutas con miles de puntos
  const routeLinePoints = staticMap
    ? (geometryPoints.length > 0 ? geometryPoints : mapPoints.map((p): [number, number] => [p.lat, p.lon]))
        .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 200)) === 0)
        .map(([lat, lon]) => staticMap.project(lat, lon))
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#09090b",
          color: "#fafafa",
          padding: 44,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow de fondo decorativo */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(234, 88, 12, 0.28) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        {/* Contenedor principal de 2 columnas */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            gap: 36,
          }}
        >
          {/* Columna Izquierda: Información de viaje y desglose */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1.35,
              justifyContent: "space-between",
            }}
          >
            {/* Header del Ticket */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>⛽</span>
                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: "#ea580c" }}>
                  PagaLaGasofa
                </span>
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: 13,
                    color: "#a1a1aa",
                    background: "#27272a",
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}
                >
                  Ticket #{shareId.slice(0, 8)}
                </span>
              </div>

              {/* Ruta A -> B o Título personalizado */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 16,
                }}
              >
                {trip.title ? (
                  <>
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: -0.5,
                      }}
                    >
                      {trip.title}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: 20,
                        fontWeight: 600,
                        color: "#a1a1aa",
                        marginTop: 4,
                      }}
                    >
                      <span>{shortOrigin}</span>
                      <span style={{ margin: "0 8px", color: "#ea580c" }}>→</span>
                      <span>{shortDest}</span>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: 34,
                      fontWeight: 800,
                      color: "#ffffff",
                      letterSpacing: -0.5,
                    }}
                  >
                    <span>{shortOrigin}</span>
                    <span style={{ margin: "0 12px", color: "#ea580c" }}>→</span>
                    <span>{shortDest}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tarjeta de Importe Destacado */}
            <div
              style={{
                display: "flex",
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 16,
                padding: "20px 28px",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 15, color: "#a1a1aa", fontWeight: 500 }}>
                  Total ({trip.passengers.length} pasajeros)
                </span>
                <span style={{ fontSize: 56, fontWeight: 900, color: "#ffffff", marginTop: 2 }}>
                  {trip.totalCost.toFixed(2)} €
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(234, 88, 12, 0.15)",
                  border: "1px solid rgba(234, 88, 12, 0.4)",
                  borderRadius: 12,
                  padding: "10px 18px",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "#ea580c", fontWeight: 700 }}>POR PERSONA</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#ea580c" }}>
                  {trip.costPerPassenger.toFixed(2)} €
                </span>
              </div>
            </div>

            {/* Fila de métricas secundarias */}
            <div style={{ display: "flex", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: 12, color: "#71717a" }}>Distancia</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#e4e4e7", marginTop: 2 }}>
                  {trip.distanceKm.toFixed(1)} km {trip.isRoundTrip ? "(I/V)" : ""}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: 12, color: "#71717a" }}>Consumo</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#e4e4e7", marginTop: 2 }}>
                  {trip.consumptionL100.toFixed(1)} l/100km
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: 12, color: "#71717a" }}>Conductor recibe</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#ea580c", marginTop: 2 }}>
                  {trip.driverReceives.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Simulación visual de tarjeta de mapa de ruta + QR */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 0.85,
              gap: 16,
              justifyContent: "space-between",
            }}
          >
            {/* Visual de Mapa de la Ruta */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 18,
                padding: 20,
                position: "relative",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              {/* Fondo decorativo con grid (solo si no hay mapa real disponible) */}
              {!staticMap && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.25,
                    backgroundImage:
                      "linear-gradient(#3f3f46 1px, transparent 1px), linear-gradient(90deg, #3f3f46 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>
                  Mapa de ruta
                </span>
                <span style={{ fontSize: 11, color: "#22c55e", background: "rgba(34, 197, 94, 0.15)", padding: "2px 8px", borderRadius: 4 }}>
                  Carretera OSRM
                </span>
              </div>

              {staticMap ? (
                /* Mapa real: tiles OSM + ruta proyectada + pines de origen/destino */
                <div
                  style={{
                    display: "flex",
                    position: "relative",
                    width: MAP_W,
                    height: MAP_H,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #27272a",
                  }}
                >
                  {staticMap.tiles.map((t, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={t.dataUrl}
                      width={256}
                      height={256}
                      alt=""
                      style={{ position: "absolute", left: t.left, top: t.top }}
                    />
                  ))}
                  {/* Velo oscuro para integrar el tile claro de OSM con el tema dark */}
                  <div style={{ position: "absolute", inset: 0, background: "rgba(9, 9, 11, 0.32)" }} />
                  <svg width={MAP_W} height={MAP_H} style={{ position: "absolute", left: 0, top: 0 }}>
                    <polyline
                      points={routeLinePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="#7c2d12"
                      strokeWidth={7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={routeLinePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth={4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      left: staticMap.project(trip.originLat!, trip.originLon!).x - 8,
                      top: staticMap.project(trip.originLat!, trip.originLon!).y - 8,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#22c55e",
                      border: "3px solid #09090b",
                      boxShadow: "0 0 10px rgba(34, 197, 94, 0.7)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: staticMap.project(trip.destLat!, trip.destLon!).x - 8,
                      top: staticMap.project(trip.destLat!, trip.destLon!).y - 8,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#ef4444",
                      border: "3px solid #09090b",
                      boxShadow: "0 0 10px rgba(239, 68, 68, 0.7)",
                    }}
                  />
                </div>
              ) : (
                /* Fallback esquemático: sin coordenadas guardadas (tickets antiguos) */
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 8px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 100 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#22c55e",
                        border: "3px solid #18181b",
                        boxShadow: "0 0 10px rgba(34, 197, 94, 0.6)",
                      }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#e4e4e7", marginTop: 6, textAlign: "center" }}>
                      {shortOrigin}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flex: 1,
                      height: 4,
                      background: "#ea580c",
                      margin: "0 10px",
                      borderRadius: 2,
                      boxShadow: "0 0 8px rgba(234, 88, 12, 0.8)",
                    }}
                  />

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 100 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#ef4444",
                        border: "3px solid #18181b",
                        boxShadow: "0 0 10px rgba(239, 68, 68, 0.6)",
                      }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#e4e4e7", marginTop: 6, textAlign: "center" }}>
                      {shortDest}
                    </span>
                  </div>
                </div>
              )}

              {/* Lista breve de pasajeros */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
                {trip.passengers.slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#a1a1aa",
                    }}
                  >
                    <span>{p.name}</span>
                    <span style={{ color: p.hasPaid ? "#22c55e" : "#e4e4e7", fontWeight: 600 }}>
                      {p.hasPaid ? "✓ Pagado" : `${p.amount.toFixed(2)} €`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code en esquina derecha */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 16,
                padding: 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                width={78}
                height={78}
                alt="QR Ticket"
                style={{ borderRadius: 8 }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                  Escanea para ver ticket
                </span>
                <span style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>
                  Marca Bizums y pagos en vivo
                </span>
                <span style={{ fontSize: 11, color: "#ea580c", marginTop: 3, fontWeight: 700 }}>
                  pagalagasofa.broslunas.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
