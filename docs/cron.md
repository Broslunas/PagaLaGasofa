# Tareas programadas (pg_cron)

La sincronización de gasolineras la dispara Postgres con `pg_cron` + `pg_net`, que llaman a una ruta protegida de la app.
**Se activa al desplegar (Fase 12)**, porque necesita una URL pública. Hasta entonces, `pnpm db:sync-stations` sincroniza a mano.

## Requisitos

1. Variable `CRON_SECRET` (mínimo 16 caracteres; la ruta rechaza todo si falta) en Vercel.
2. En Supabase → Database → Extensions, activar `pg_cron` y `pg_net`.
3. Guardar el secreto en Vault (no en texto plano en el SQL):

```sql
select vault.create_secret('<el mismo CRON_SECRET>', 'cron_secret');
```

## Sincronización horaria de gasolineras

```sql
select cron.schedule(
  'sync-stations',
  '5 * * * *', -- minuto 5 de cada hora
  $$
  select net.http_post(
    url := 'https://pagalagasofa.broslunas.com/api/cron/sync-stations',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 55000
  );
  $$
);
```

La ruta (`src/app/api/cron/sync-stations/route.ts`) sincroniza los precios y, con ellos ya actualizados, **revisa las alertas de precio** de las favoritas y envía los avisos (centro de notificaciones, Web Push y email). Tarda unos 15 s y tiene `maxDuration = 60`. Un fallo al enviar avisos no invalida la sincronización.

## Mantenimiento

```sql
-- Contadores de límite de peticiones de más de un día.
select cron.schedule('purge-rate-limits', '17 3 * * *', $$ delete from public.rate_limits where window_start < now() - interval '1 day' $$);

-- Notificaciones leídas de más de 90 días.
select cron.schedule('purge-notifications', '29 3 * * *', $$ delete from public.notifications where read_at is not null and read_at < now() - interval '90 days' $$);

-- Sesiones de ubicación en vivo terminadas o caducadas (la posición ya se borra al parar; esto limpia las filas).
select cron.schedule('purge-live-shares', '31 3 * * *', $$ update public.live_shares set lat = null, lng = null, accuracy_m = null, heading_deg = null, speed_ms = null, position_at = null where expires_at < now() and lat is not null; delete from public.live_shares where expires_at < now() - interval '1 day' $$);

-- Tickets anónimos caducados (el histórico de pagos se borra en cascada).
select cron.schedule('purge-expired-trips', '23 3 * * *', $$ delete from public.trips where expires_at is not null and expires_at < now() $$);
```

Para ver el estado: `select * from cron.job_run_details order by start_time desc limit 20;`

## Variables de entorno de los avisos

- `CRON_SECRET`: mismo valor en Vercel y en Vault.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: **las mismas en local y en producción**; si cambian, los dispositivos ya suscritos dejan de recibir avisos.
- `MAILJET_API_KEY`, `MAILJET_API_SECRET`, `MAILJET_FROM_EMAIL` (remitente de un dominio validado en Mailjet) y `MAILJET_FROM_NAME`.
