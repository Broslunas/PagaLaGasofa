import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function LiveNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">No encontramos esta sesión</h1>
      <p className="text-muted-foreground">El enlace puede estar mal copiado o la sesión ya se ha borrado.</p>
      <Button asChild>
        <Link href="/en-vivo">Compartir mi ubicación</Link>
      </Button>
    </div>
  )
}
