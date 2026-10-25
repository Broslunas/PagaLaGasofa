/** CSV pensado para Excel en español: separador `;`, comas decimales, UTF-8 con BOM y comillas bien escapadas. */
export function toCsv<T>(rows: T[], columns: { header: string; value: (row: T) => string | number | boolean | null | undefined }[]): string {
  const cell = (v: string | number | boolean | null | undefined) => {
    if (v === null || v === undefined) return ""
    const text = typeof v === "number" ? String(v).replace(".", ",") : String(v)
    // Se neutralizan las «fórmulas» (=, +, -, @) para que Excel no las ejecute si alguien escribió un nombre malicioso.
    const safe = typeof v === "string" && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
    return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const lines = [columns.map((c) => cell(c.header)).join(";"), ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(";"))]
  return `﻿${lines.join("\r\n")}\r\n`
}
