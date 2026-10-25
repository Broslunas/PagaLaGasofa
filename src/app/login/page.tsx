import type { Metadata } from "next"
import { Suspense } from "react"

import { LogoMark } from "@/components/brand/logo"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { es } from "@/i18n/es"

export const metadata: Metadata = { title: es.auth.login }

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader className="items-center text-center">
          <LogoMark className="mb-2 size-12" />
          <CardTitle className="text-2xl">{es.auth.title}</CardTitle>
          <CardDescription>{es.auth.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">{es.auth.anonymousNote}</p>
    </div>
  )
}
