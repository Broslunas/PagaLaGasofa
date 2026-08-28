"use client";

import { useMemo } from "react";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { parseSchedule, type DayOfWeek } from "@/lib/schedule-parser";

interface StationScheduleCardProps {
  scheduleRaw: string | undefined | null;
}

export function StationScheduleCard({ scheduleRaw }: StationScheduleCardProps) {
  const scheduleData = useMemo(() => parseSchedule(scheduleRaw), [scheduleRaw]);

  const now = new Date();
  const jsDay = now.getDay();
  const currentDayKey: DayOfWeek = jsDay === 0 ? "D" : (["L", "M", "X", "J", "V", "S", "D"][jsDay - 1] as DayOfWeek);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      {/* Header with Live Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Horario de Apertura</h2>
            <p className="text-[11px] text-muted-foreground">Estado y apertura semanal</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          {scheduleData.isOpen ? (
            scheduleData.closingSoon ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                <AlertCircle className="h-3.5 w-3.5" />
                {scheduleData.statusText}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {scheduleData.statusText}
              </span>
            )
          ) : scheduleData.openingSoon ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
              <AlertCircle className="h-3.5 w-3.5" />
              {scheduleData.statusText}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-500">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <XCircle className="h-3.5 w-3.5" />
              {scheduleData.statusText}
            </span>
          )}
        </div>
      </div>

      {/* Day by Day List */}
      <div className="mt-4 space-y-1.5">
        {scheduleData.days.map((dayItem) => {
          const isToday = dayItem.day === currentDayKey;

          return (
            <div
              key={dayItem.day}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                isToday
                  ? "border border-primary/40 bg-primary/10 font-bold text-foreground shadow-xs"
                  : "bg-accent/30 text-foreground/80 hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] uppercase font-black ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {dayItem.day}
                </span>
                <span className="text-xs">
                  {dayItem.name}
                  {isToday && (
                    <span className="ml-1.5 text-[10px] font-semibold text-primary">
                      (Hoy)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {dayItem.isOpen24H ? (
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-500">
                    24 Horas
                  </span>
                ) : dayItem.isClosed ? (
                  <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
                    Cerrado
                  </span>
                ) : (
                  <span className="font-semibold text-foreground/90 font-mono text-[11px]">
                    {dayItem.rawText}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw textual schedule footnote if available */}
      {scheduleRaw && (
        <div className="mt-3 border-t border-border/40 pt-2.5 text-[10px] text-muted-foreground/70 flex items-center justify-between">
          <span>Registro oficial:</span>
          <span className="font-mono text-foreground/60 truncate max-w-[240px] text-right" title={scheduleRaw}>
            {scheduleRaw}
          </span>
        </div>
      )}
    </div>
  );
}
