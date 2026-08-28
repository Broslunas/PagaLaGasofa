"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      // next-themes injects a raw <script> for FOUC prevention, which trips React
      // 19/Next 16's "script tag in component" dev warning. Server render keeps
      // the executable type; client-side remounts use a non-executable type since
      // the script already ran before hydration. Upstream bug, unfixed:
      // https://github.com/pacocoursey/next-themes/issues/387
      scriptProps={typeof window === "undefined" ? undefined : { type: "application/json" }}
    >
      {children}
    </NextThemesProvider>
  );
}
