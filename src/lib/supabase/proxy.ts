import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth/redirect"

import { isSupabaseConfigured, supabaseEnv } from "./env"

/** Prefijos que exigen sesión. `/app` y `/t/*` son públicos (también para anónimos). */
const PROTECTED_PREFIXES = ["/dashboard"]

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured()) return response

  const { url, anonKey } = supabaseEnv()
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // getClaims valida el JWT localmente y refresca la sesión si hace falta.
  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data?.claims)

  const { pathname, search } = request.nextUrl
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (needsAuth && !isSignedIn) {
    const login = request.nextUrl.clone()
    login.pathname = "/login"
    login.search = `?next=${encodeURIComponent(safeNextPath(pathname + search))}`
    return NextResponse.redirect(login)
  }

  return response
}
