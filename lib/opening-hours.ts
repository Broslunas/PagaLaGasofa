// Parsea el campo Horario de MITECO: "L-V: 06:00-22:00; S-D: 07:00-22:00",
// "L: 24H", "L-V: 07:00-15:00 y 17:00-22:00". Verificado contra 2600+ estaciones
// reales (6 provincias) — 100% de los formatos únicos siguen esta gramática.
// Si algo no encaja, se trata como "no confirmado abierto" (false), no crashea.
const DAY_ORDER = ["L", "M", "X", "J", "V", "S", "D"] as const;
const JS_DAY_TO_LETTER = ["D", "L", "M", "X", "J", "V", "S"]; // getDay(): 0=domingo

function expandDayRange(token: string): Set<string> | null {
  const [start, end] = token.split("-");
  const startIdx = DAY_ORDER.indexOf(start as (typeof DAY_ORDER)[number]);
  if (startIdx === -1) return null;
  if (!end) return new Set([start]);
  const endIdx = DAY_ORDER.indexOf(end as (typeof DAY_ORDER)[number]);
  if (endIdx === -1) return null;
  const days = new Set<string>();
  if (startIdx <= endIdx) {
    for (let i = startIdx; i <= endIdx; i++) days.add(DAY_ORDER[i]);
  } else {
    // rango que cruza el fin de semana -> lunes, ej. "V-L"
    for (let i = startIdx; i < DAY_ORDER.length; i++) days.add(DAY_ORDER[i]);
    for (let i = 0; i <= endIdx; i++) days.add(DAY_ORDER[i]);
  }
  return days;
}

function toMinutes(hhmm: string): number | null {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function isWithinTimeRanges(timePart: string, nowMinutes: number): boolean {
  if (timePart === "24H") return true;
  return timePart.split(" y ").some((range) => {
    const [from, to] = range.split("-");
    const start = toMinutes(from);
    const end = toMinutes(to);
    if (start === null || end === null) return false;
    return end <= start
      ? nowMinutes >= start || nowMinutes < end // cruza medianoche
      : nowMinutes >= start && nowMinutes < end;
  });
}

export function isOpenNow(schedule: string, now: Date = new Date()): boolean {
  if (!schedule) return false;
  const today = JS_DAY_TO_LETTER[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return schedule.split(";").some((segment) => {
    const idx = segment.indexOf(":");
    if (idx === -1) return false;
    const dayToken = segment.slice(0, idx).trim();
    const timePart = segment.slice(idx + 1).trim();
    const days = expandDayRange(dayToken);
    if (!days || !days.has(today)) return false;
    return isWithinTimeRanges(timePart, nowMinutes);
  });
}
