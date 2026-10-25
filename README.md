# PagaLaGasofa

Calcula el coste de un viaje en coche y repártelo entre los pasajeros. Consulta además los precios oficiales de las gasolineras de España.

> **Versión 2 en construcción.** Se reconstruye desde cero, por fases. El código de la versión anterior está en la rama [`legacy/v1`](https://github.com/Broslunas/PagaLaGasofa/tree/legacy/v1).

## Stack previsto

Next.js, TypeScript, Tailwind 4, shadcn/ui, Supabase (Postgres, Auth, Realtime), Drizzle, MapLibre, Vercel.

## Fases

1. Fundaciones
2. Datos y auth
3. Núcleo de cálculo
4. Mapas y rutas
5. Calculador de viaje
6. Ticket público
7. Gasolineras
8. Notificaciones
9. Ubicación en vivo
10. Dashboard
11. Landing, PWA y legal
12. Migración y salida

Cada fase cierra con un commit y un tag `fase-N`.

## Desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test
```

Copia `.env.example` a `.env.local` y rellena las variables según avancen las fases.
La propuesta de identidad (paleta, tipografía, logo) está en `/design`.
