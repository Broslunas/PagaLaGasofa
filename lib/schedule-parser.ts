export type DayOfWeek = "L" | "M" | "X" | "J" | "V" | "S" | "D";

export interface DaySchedule {
  day: DayOfWeek;
  name: string;
  shortName: string;
  isOpen24H: boolean;
  isClosed: boolean;
  timeRanges: Array<{ open: string; close: string }>; // e.g. [{ open: "06:00", close: "22:00" }]
  rawText: string;
}

export interface StationScheduleStatus {
  isOpen: boolean;
  closingSoon: boolean; // closes within next 60 minutes
  openingSoon: boolean; // opens within next 60 minutes
  statusText: string;
  days: DaySchedule[];
  rawSchedule: string;
  isAlwaysOpen: boolean;
}

const DAY_NAMES: Record<DayOfWeek, { name: string; shortName: string; index: number }> = {
  L: { name: "Lunes", shortName: "Lun", index: 1 },
  M: { name: "Martes", shortName: "Mar", index: 2 },
  X: { name: "Miércoles", shortName: "Mié", index: 3 },
  J: { name: "Jueves", shortName: "Jue", index: 4 },
  V: { name: "Viernes", shortName: "Vie", index: 5 },
  S: { name: "Sábado", shortName: "Sáb", index: 6 },
  D: { name: "Domingo", shortName: "Dom", index: 0 },
};

const ORDERED_DAYS: DayOfWeek[] = ["L", "M", "X", "J", "V", "S", "D"];

function getDayRange(start: DayOfWeek, end: DayOfWeek): DayOfWeek[] {
  const sIdx = ORDERED_DAYS.indexOf(start);
  const eIdx = ORDERED_DAYS.indexOf(end);
  if (sIdx === -1 || eIdx === -1) return [start];
  if (sIdx <= eIdx) {
    return ORDERED_DAYS.slice(sIdx, eIdx + 1);
  }
  return [...ORDERED_DAYS.slice(sIdx), ...ORDERED_DAYS.slice(0, eIdx + 1)];
}

function parseDayLetter(letter: string): DayOfWeek | null {
  const norm = letter.toUpperCase().trim();
  if (norm === "L" || norm === "LU" || norm === "LUN") return "L";
  if (norm === "M" || norm === "MA" || norm === "MAR") return "M";
  if (norm === "X" || norm === "MI" || norm === "MIE" || norm === "MIÉ") return "X";
  if (norm === "J" || norm === "JU" || norm === "JUE") return "J";
  if (norm === "V" || norm === "VI" || norm === "VIE") return "V";
  if (norm === "S" || norm === "SA" || norm === "SAB" || norm === "SÁB") return "S";
  if (norm === "D" || norm === "DO" || norm === "DOM") return "D";
  return null;
}

export function parseSchedule(raw: string | undefined | null): StationScheduleStatus {
  const cleanRaw = (raw || "").trim();

  const daysMap: Record<DayOfWeek, DaySchedule> = {
    L: { day: "L", name: "Lunes", shortName: "Lun", isOpen24H: false, isClosed: false, timeRanges: [], rawText: "" },
    M: { day: "M", name: "Martes", shortName: "Mar", isOpen24H: false, isClosed: false, timeRanges: [], rawText: "" },
    X: { day: "X", name: "Miércoles", shortName: "Mié", isOpen24H: false, isClosed: false, timeRanges: [], rawText: "" },
    J: { day: "J", name: "Jueves", shortName: "Jue", isOpen24H: false, isClosed: false, timeRanges: [], rawText: "" },
    V: { day: "V", name: "Viernes", shortName: "Vie", isOpen24H: false, isClosed: false, timeRanges: [], rawText: "" },
    S: { day: "S", name: "Sábado", shortName: "Sáb", isOpen24H: false, isClosed: false, timeRanges: [], rawText: "" },
    D: { day: "D", name: "Domingo", shortName: "Dom", isOpen24H: false, isClosed: false, timeRanges: [], rawText: "" },
  };

  const is24HGlobal =
    /^(24\s*H(ORAS)?|L-D:\s*24\s*H(ORAS)?|ABIERTO\s*24\s*H(ORAS)?)$/i.test(cleanRaw) ||
    cleanRaw === "24H" ||
    cleanRaw === "L-D: 24H";

  if (is24HGlobal) {
    ORDERED_DAYS.forEach((d) => {
      daysMap[d].isOpen24H = true;
      daysMap[d].rawText = "24 Horas";
      daysMap[d].timeRanges = [{ open: "00:00", close: "23:59" }];
    });

    return {
      isOpen: true,
      closingSoon: false,
      openingSoon: false,
      statusText: "Abierto 24 Horas",
      days: ORDERED_DAYS.map((d) => daysMap[d]),
      rawSchedule: cleanRaw,
      isAlwaysOpen: true,
    };
  }

  if (!cleanRaw) {
    return {
      isOpen: false,
      closingSoon: false,
      openingSoon: false,
      statusText: "Horario no disponible",
      days: ORDERED_DAYS.map((d) => ({
        ...daysMap[d],
        rawText: "Sin información",
      })),
      rawSchedule: cleanRaw,
      isAlwaysOpen: false,
    };
  }

  // Split clauses separated by ';'
  const parts = cleanRaw.split(";").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    // Examples:
    // "L-J: 06:00-00:00"
    // "V: 24H"
    // "S-D: 06:00-02:00"
    // "L-D: 07:00-23:00"
    // "L-V: 07:00-14:00 y 16:00-20:00"
    // "L: 08:00-15:00"
    // "D: CERRADO"
    const colonIdx = part.indexOf(":");
    if (colonIdx === -1) {
      if (/24\s*H/i.test(part)) {
        ORDERED_DAYS.forEach((d) => {
          daysMap[d].isOpen24H = true;
          daysMap[d].rawText = "24 Horas";
          daysMap[d].timeRanges = [{ open: "00:00", close: "23:59" }];
        });
      }
      continue;
    }

    const dayPrefix = part.substring(0, colonIdx).trim().toUpperCase();
    const hoursPart = part.substring(colonIdx + 1).trim();

    const targetDays: DayOfWeek[] = [];
    if (dayPrefix.includes("-")) {
      const [startStr, endStr] = dayPrefix.split("-").map((s) => s.trim());
      const s = parseDayLetter(startStr);
      const e = parseDayLetter(endStr);
      if (s && e) {
        targetDays.push(...getDayRange(s, e));
      }
    } else if (dayPrefix.includes(",")) {
      dayPrefix.split(",").forEach((s) => {
        const d = parseDayLetter(s.trim());
        if (d) targetDays.push(d);
      });
    } else {
      const d = parseDayLetter(dayPrefix);
      if (d) targetDays.push(d);
    }

    // Parse hours in this segment
    const is24H = /24\s*H/i.test(hoursPart);
    const isClosed = /CERRADO/i.test(hoursPart);
    const timeRanges: Array<{ open: string; close: string }> = [];

    if (is24H) {
      timeRanges.push({ open: "00:00", close: "23:59" });
    } else if (!isClosed) {
      // Find all HH:MM-HH:MM or HH:MM - HH:MM
      const rangeRegex = /(\d{1,2}:\d{2})\s*(?:-|a)\s*(\d{1,2}:\d{2})/gi;
      let match: RegExpExecArray | null;
      while ((match = rangeRegex.exec(hoursPart)) !== null) {
        timeRanges.push({
          open: match[1].padStart(5, "0"),
          close: match[2].padStart(5, "0"),
        });
      }
    }

    targetDays.forEach((d) => {
      daysMap[d].isOpen24H = is24H;
      daysMap[d].isClosed = isClosed;
      daysMap[d].timeRanges = timeRanges;
      daysMap[d].rawText = is24H ? "24 Horas" : isClosed ? "Cerrado" : hoursPart;
    });
  }

  // Fill in any unspecified day as closed or raw fallback
  ORDERED_DAYS.forEach((d) => {
    if (!daysMap[d].rawText) {
      daysMap[d].isClosed = true;
      daysMap[d].rawText = "Cerrado";
    }
  });

  // Compute live current status (Spanish local time / browser time)
  const now = new Date();
  // 0 is Sunday, 1 is Monday...
  const jsDay = now.getDay();
  const dayKey: DayOfWeek = jsDay === 0 ? "D" : ORDERED_DAYS[jsDay - 1];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = daysMap[dayKey];
  let isOpen = false;
  let closingSoon = false;
  let openingSoon = false;
  let statusText = "Cerrado";

  if (todaySchedule.isOpen24H) {
    isOpen = true;
    statusText = "Abierto 24 Horas";
  } else if (!todaySchedule.isClosed && todaySchedule.timeRanges.length > 0) {
    for (const range of todaySchedule.timeRanges) {
      const [oH, oM] = range.open.split(":").map(Number);
      const [cH, cM] = range.close.split(":").map(Number);
      const openMin = oH * 60 + oM;
      let closeMin = cH * 60 + cM;
      if (closeMin === 0 || closeMin < openMin) {
        // e.g. 00:00 or closes after midnight (02:00)
        closeMin += 24 * 60;
      }

      const effectiveNow = currentMinutes < openMin && closeMin > 24 * 60 ? currentMinutes + 24 * 60 : currentMinutes;

      if (effectiveNow >= openMin && effectiveNow < closeMin) {
        isOpen = true;
        const remaining = closeMin - effectiveNow;
        if (remaining <= 60 && remaining > 0) {
          closingSoon = true;
          statusText = `Cierra pronto (${range.close})`;
        } else {
          statusText = `Abierto hasta las ${range.close}`;
        }
        break;
      } else if (openMin > currentMinutes && openMin - currentMinutes <= 60) {
        openingSoon = true;
        statusText = `Abre pronto (${range.open})`;
      }
    }
  }

  return {
    isOpen,
    closingSoon,
    openingSoon,
    statusText,
    days: ORDERED_DAYS.map((d) => daysMap[d]),
    rawSchedule: cleanRaw,
    isAlwaysOpen: false,
  };
}
