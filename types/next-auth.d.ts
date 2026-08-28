import type { DefaultSession } from "next-auth";

// Auth.js v5's default session callback drops user.id from session.user — auth.ts
// re-adds it (see callbacks.session there); this just teaches the type checker about it.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
