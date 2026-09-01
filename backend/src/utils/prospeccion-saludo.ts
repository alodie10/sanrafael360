export const PROSPECCION_TZ = 'America/Argentina/Mendoza';

/** 06–11 Buen día · 12–19 Buenas tardes · 20–05 Buenas noches. */
export function greetingForHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 6 && h < 12) return '¡Buen día!';
  if (h >= 12 && h < 20) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

export function hourInTimeZone(
  now: Date = new Date(),
  timeZone: string = PROSPECCION_TZ
): number {
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).format(now);
  const hour = parseInt(hourStr, 10);
  return hour === 24 ? 0 : hour;
}

export function greetingNow(now: Date = new Date()): string {
  return greetingForHour(hourInTimeZone(now));
}
