"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";

// Viaje es un wizard a pantalla completa sin scroll — el footer no encaja ahí.
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/viaje") return null;
  return <Footer />;
}
