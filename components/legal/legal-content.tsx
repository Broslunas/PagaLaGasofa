import type { ReactNode } from "react";

/** Shared shell for legal pages — plain semantic HTML (h2/p/ul) styled via descendant selectors, no typography plugin. */
export function LegalContent({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:py-14">
      <div className="mb-8 space-y-1 border-b border-border/50 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="text-sm text-muted-foreground">Última actualización: {updated}</p>
      </div>
      <div
        className="space-y-5 text-sm leading-relaxed text-foreground/90
          [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:first:mt-0
          [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold
          [&_p]:text-muted-foreground
          [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-muted-foreground
          [&_li]:leading-relaxed
          [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:font-semibold [&_strong]:text-foreground"
      >
        {children}
      </div>
    </div>
  );
}
