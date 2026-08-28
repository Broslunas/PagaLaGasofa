import Link from "next/link";
import { LoginButton } from "@/components/auth/login-button";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link href="/" className="text-lg font-semibold">
        ⛽ PagaLaGasofa
      </Link>
      <LoginButton />
    </header>
  );
}
