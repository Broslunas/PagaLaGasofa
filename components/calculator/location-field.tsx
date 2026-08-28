"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GeoPoint {
  label: string;
  lat: number;
  lon: number;
}

export function LocationField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: GeoPoint | null;
  onChange: (point: GeoPoint | null) => void;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<GeoPoint[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 3 || query === value?.label) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      setSuggestions(res.ok ? await res.json() : []);
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={query}
        placeholder="Escribe una dirección o ciudad..."
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(null);
        }}
      />
      {suggestions.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          {suggestions.map((s) => (
            <li key={`${s.lat},${s.lon}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onChange(s);
                  setQuery(s.label);
                  setSuggestions([]);
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
