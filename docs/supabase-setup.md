# Configuración de Supabase

## 1. Proyecto y variables
1. Crea un proyecto en Supabase (región UE).
2. Copia a `.env.local` (ver `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API).
   - `DATABASE_URL`: cadena del *pooler* en modo transacción (Settings → Database → Connection string, puerto 6543).
3. Aplica las migraciones: `pnpm db:migrate`.

## 2. Auth
- **Site URL:** `http://localhost:3000` en local y `https://pagalagasofa.broslunas.com` en producción.
- **Redirect URLs:** `http://localhost:3000/auth/callback` y `https://pagalagasofa.broslunas.com/auth/callback`.
- **Google:** crea credenciales OAuth en Google Cloud con `https://<proyecto>.supabase.co/auth/v1/callback` como URI de redirección, y pega el Client ID y el secreto en Auth → Providers → Google.
- **Email mágico:** Auth → Providers → Email activado (sin confirmación de contraseña).
- **SMTP (Mailjet):** Auth → SMTP Settings → host `in-v3.mailjet.com`, puerto 587, usuario = API key, contraseña = Secret key. El remitente debe ser una dirección o dominio validado en Mailjet.

## 3. Modelo de acceso
Las consultas del servidor usan Drizzle con la conexión directa (rol `postgres`), así que cada acción comprueba al usuario con `requireUser()` y filtra por `user_id`. Las políticas RLS de `drizzle/0000_init.sql` protegen además cualquier acceso directo con la anon key o el token de usuario.
