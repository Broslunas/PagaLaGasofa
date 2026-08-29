"use client";

import { useState } from "react";
import { getBrandColor, getBrandInitials } from "@/lib/brand-icon";
import { getBrandLogoUrl } from "@/lib/brand-logo";

export function BrandAvatar({
  brand,
  className = "size-9 text-xs",
}: {
  brand: string;
  className?: string;
}) {
  const label = brand || "Estación";
  const logoUrl = getBrandLogoUrl(label);
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- asset local en public/, no vale la pena el remotePattern/loader de next/image para esto
      <img
        src={logoUrl}
        alt={label}
        title={label}
        className={`shrink-0 rounded-lg border border-border/50 bg-white object-contain p-1 ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-white ${className}`}
      style={{ backgroundColor: getBrandColor(label) }}
      title={label}
      aria-hidden="true"
    >
      {getBrandInitials(label)}
    </div>
  );
}
