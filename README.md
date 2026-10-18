# PagaLaGasofa

Aplicación web para calcular costes de viajes en coche, repartir gastos entre pasajeros y consultar gasolineras con precios oficiales en España.

## Qué hace

- Calcula distancia, consumo, peajes y coste total del viaje.
- Reparte el coste entre pasajeros y genera un ticket compartible.
- Guarda viajes, vehículos y gasolineras favoritas para usuarios autenticados.
- Muestra mapa de rutas y resumen de actividad en dashboard.
- Consulta precios de combustible y detalle de estaciones (MITECO).
- Incluye notificaciones y soporte de Web Push.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Lenguaje:** TypeScript
- **Estilos/UI:** Tailwind CSS 4 + componentes UI propios
- **Autenticación:** Auth.js (NextAuth v5 beta) con Google OAuth
- **Base de datos:** MongoDB + Prisma ORM

## Requisitos

- Node.js 20+
- npm 10+
- Base de datos MongoDB accesible (Atlas recomendado)
- Credenciales OAuth de Google (si quieres login social)

## Instalación

1. Instala dependencias:

```bash
npm install
```

2. Copia variables de entorno:

```bash
cp .env.example .env
```

3. Rellena `.env` con tus valores (`DATABASE_URL`, `AUTH_SECRET`, etc.).

4. Prisma Client se genera automáticamente tras `npm install` (script `postinstall`).

## Variables de entorno principales

Revisa `.env.example` para el listado completo.

- `DATABASE_URL`: conexión MongoDB
- `AUTH_SECRET`: secreto de Auth.js
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`: login con Google
- `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`: estimación de consumo con IA (opcional)
- `CRON_SECRET`: protección de endpoints cron
- `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Web Push

## Scripts

```bash
npm run dev    # entorno local
npm run lint   # eslint
npm run build  # build de producción
npm run start  # arrancar build en producción
```

## Desarrollo

Arranca la app en local:

```bash
npm run dev
```

Después abre `http://localhost:3000`.

## Estructura (resumen)

- `/app`: rutas, páginas y API Routes
- `/components`: componentes de interfaz y bloques funcionales
- `/lib`: utilidades de negocio, servicios y helpers
- `/prisma`: esquema de datos

## Notas

- El proyecto usa **Prisma 6.19.3** con MongoDB.
- Algunas funciones (cron, push, login social) dependen de configurar correctamente sus variables de entorno.
