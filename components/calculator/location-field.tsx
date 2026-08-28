"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed } from "lucide-react";

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
  onFocus,
  active,
}: {
  id: string;
  label: string;
  value: GeoPoint | null;
  onChange: (point: GeoPoint | null) => void;
  onFocus?: () => void;
  active?: boolean;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<GeoPoint[]>([]);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
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

  // Punto fijado desde fuera (clic en el mapa o geolocalización) — refleja su etiqueta.
  // No se toca cuando value es null: eso también pasa mientras el usuario escribe.
  useEffect(() => {
    if (value) setQuery(value.label);
  }, [value]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocateError("Este navegador no soporta geolocalización");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
          onChange(
            res.ok ? await res.json() : { label: `${lat.toFixed(5)}, ${lon.toFixed(5)}`, lat, lon }
          );
        } catch {
          onChange({ label: `${lat.toFixed(5)}, ${lon.toFixed(5)}`, lat, lon });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocateError("No se pudo obtener tu ubicación");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-1.5">
        <Input
          id={id}
          value={query}
          placeholder="Dirección, ciudad o clic en el mapa..."
          className={active ? "border-primary ring-2 ring-primary/30" : undefined}
          onFocus={onFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Usar mi ubicación"
          disabled={locating}
          onClick={useMyLocation}
        >
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
        </Button>
      </div>
      {locateError && <span className="text-xs text-destructive">{locateError}</span>}
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
