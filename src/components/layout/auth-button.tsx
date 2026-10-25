import Link from "next/link"

import { Button } from "@/components/ui/button"
import { es } from "@/i18n/es"
import { getUser } from "@/lib/auth/session"

export async function AuthButton() {
  const user = await getUser()

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/login">{es.auth.login}</Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard">{es.auth.dashboard}</Link>
      </Button>
      <form action="/auth/signout" method="post">
        <Button type="submit" variant="ghost" size="sm">
          {es.auth.logout}
        </Button>
      </form>
    </div>
  )
}
