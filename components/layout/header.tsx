import Link from "next/link";
import { Fuel } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <Fuel className="text-primary" size={20} />
        PagaLaGasofa
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
