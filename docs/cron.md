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

La ruta (`src/app/api/cron/sync-stations/route.ts`) tarda unos 17 s y tiene `maxDuration = 60`.

## Mantenimiento

```sql
-- Contadores de límite de peticiones de más de un día.
select cron.schedule('purge-rate-limits', '17 3 * * *', $$ delete from public.rate_limits where window_start < now() - interval '1 day' $$);

-- Tickets anónimos caducados (el histórico de pagos se borra en cascada).
select cron.schedule('purge-expired-trips', '23 3 * * *', $$ delete from public.trips where expires_at is not null and expires_at < now() $$);
```

Para ver el estado: `select * from cron.job_run_details order by start_time desc limit 20;`
