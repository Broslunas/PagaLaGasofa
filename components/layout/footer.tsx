import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-4 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-foreground">
          <Image src="/logo.svg" alt="PagaLaGasofa" width={22} height={22} className="rounded" />
          PagaLaGasofa
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/viaje" className="hover:text-foreground">
            Viaje
          </Link>
          <Link href="#como-funciona" className="hover:text-foreground">
            Cómo funciona
          </Link>
        </nav>
        <p>
          © {new Date().getFullYear()} PagaLaGasofa · Creado por{" "}
          <a
            href="https://broslunas.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            Broslunas
          </a>
        </p>
      </div>
    </footer>
  );
}
