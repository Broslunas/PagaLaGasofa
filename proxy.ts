// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same runtime, same API).
// Optimistic auth check only — reads the session cookie, no DB hit. Not the
// only line of defense: real authorization still belongs next to the data
// (Server Actions / Route Handlers / DAL), see auth.ts callers.
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PROTECTED_PREFIXES = ["/dashboard", "/garage", "/history"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const url = new URL("/", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg)$).*)"],
};
