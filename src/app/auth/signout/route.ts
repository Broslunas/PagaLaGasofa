import { NextResponse, type NextRequest } from "next/server"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  // 303 para que el navegador siga con GET tras el POST.
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), 303)
}
