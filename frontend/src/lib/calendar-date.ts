/**
 * Helpers for date-only UI fields (type="date") stored as DateTime in Strapi.
 * Avoids the classic UTC midnight shift (1 dic → 30 nov in Argentina).
 */

/** YYYY-MM-DD from an ISO datetime, using the viewer's local calendar day. */
export function toDateInputValue(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Start of the selected calendar day in local time → ISO for Strapi. */
export function dateInputToStartOfDayISO(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

/** End of the selected calendar day in local time → ISO for Strapi. */
export function dateInputToEndOfDayISO(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

const MENDOZA_TZ = "America/Argentina/Mendoza";

const MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Día de calendario en Mendoza, igual en Vercel (UTC) y en el navegador. */
function mendozaCalendar(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MENDOZA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = read("year");
  const month = read("month");
  const day = read("day");
  if (!year || !month || !day) return null;
  return { year, month, day };
}

/**
 * Etiqueta de calendario en español, siempre en hora de Mendoza.
 * `toLocaleDateString` sin zona usa UTC en el servidor y ART en el cliente,
 * y ese texto distinto rompe la hidratación (React #418).
 */
export function formatCalendarDate(
  isoOrDate: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }
): string {
  try {
    const date = new Date(isoOrDate);
    if (Number.isNaN(date.getTime())) return "";
    const parts = mendozaCalendar(date);
    if (!parts) return "";

    const dayLabel = options.day === "2-digit" ? String(parts.day).padStart(2, "0") : String(parts.day);
    const yearLabel = options.year === "2-digit" ? String(parts.year).slice(-2) : String(parts.year);
    const includeYear = options.year === "numeric" || options.year === "2-digit";
    const monthStyle = options.month ?? "long";

    if (monthStyle === "short" || monthStyle === "narrow") {
      const monthLabel = MONTHS_SHORT[parts.month - 1];
      return includeYear ? `${dayLabel} ${monthLabel} ${yearLabel}` : `${dayLabel} ${monthLabel}`;
    }

    const monthLabel = MONTHS_LONG[parts.month - 1];
    return includeYear
      ? `${dayLabel} de ${monthLabel} de ${yearLabel}`
      : `${dayLabel} de ${monthLabel}`;
  } catch {
    return "";
  }
}
