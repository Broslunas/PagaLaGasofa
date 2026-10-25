import Link from "next/link"

import { Button } from "@/components/ui/button"
import { es } from "@/i18n/es"

export default function AuthErrorPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">{es.auth.errorTitle}</h1>
      <p className="text-muted-foreground">{es.auth.errorBody}</p>
      <Button asChild>
        <Link href="/login">{es.auth.backToLogin}</Link>
      </Button>
    </div>
  )
}
