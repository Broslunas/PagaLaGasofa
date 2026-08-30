import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/terminos", label: "Términos y condiciones" },
];

export default function LegalLayout({ children }: LayoutProps<"/legal">) {
  return (
    <main className="flex flex-1 flex-col">
      <nav className="border-b border-border/50 bg-muted/30 px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-x-4 gap-y-1 text-sm">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </main>
  );
}
