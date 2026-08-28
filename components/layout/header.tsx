import Link from "next/link";
import Image from "next/image";
import { LoginButton } from "@/components/auth/login-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
        <Image src="/logo.svg" alt="PagaLaGasofa" width={28} height={28} className="rounded-lg shadow-sm" />
        <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          PagaLaGasofa
        </span>
      </Link>
      <nav className="flex items-center gap-3">
        <Link
          href="/app"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Calculadora
        </Link>
        <ThemeToggle />
        <LoginButton />
      </nav>
    </header>
  );
}
