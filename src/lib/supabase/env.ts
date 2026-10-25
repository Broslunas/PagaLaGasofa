// Las variables NEXT_PUBLIC_* deben leerse de forma estática para que Next las inyecte en el cliente.
function read() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    // Supabase renombró la anon key a «publishable key»; se admiten ambos nombres.
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

export function supabaseEnv() {
  const { url, key } = read()
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    )
  }
  return { url, anonKey: key }
}

export function isSupabaseConfigured() {
  const { url, key } = read()
  return Boolean(url && key)
}
