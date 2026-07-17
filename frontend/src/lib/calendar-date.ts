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

/** Format an ISO datetime as a calendar label in es-AR (local day). */
export function formatCalendarDate(
  isoOrDate: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }
): string {
  try {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-AR", options);
  } catch {
    return "";
  }
}
