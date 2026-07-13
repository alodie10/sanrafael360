export type GoogleScheduleEntry = {
  day: string;
  is_closed: boolean;
  opening_time: string | null;
  closing_time: string | null;
};

/**
 * Parses Google Maps hours text into structured Strapi schedules.
 */
export function parseGoogleHours(hoursText: string): GoogleScheduleEntry[] {
  if (!hoursText) return [];

  const daysMapping: Record<string, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miércoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sábado: 'Sábado',
    domingo: 'Domingo',
  };

  const normalized = hoursText
    .replace(/[\u00a0\u200b\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const segments = normalized.split(';').map((s) => s.trim()).filter((s) => s.length > 0);
  const schedules: GoogleScheduleEntry[] = [];
  const dayPattern = /(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/i;

  function normalizeTime(timeStr: string, meridiem: string | null): string {
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    if (meridiem) {
      const isPM = meridiem.toLowerCase().replace(/[^apm]/g, '').startsWith('p');
      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000`;
  }

  for (const segment of segments) {
    const dayMatch = segment.match(dayPattern);
    if (!dayMatch) continue;

    const dayKey = dayMatch[0]
      .toLowerCase()
      .replace('miercoles', 'miércoles')
      .replace('sabado', 'sábado');
    const day = daysMapping[dayKey];
    if (!day) continue;

    if (segment.toLowerCase().includes('cerrado')) {
      schedules.push({ day, is_closed: true, opening_time: null, closing_time: null });
      continue;
    }

    const RANGE_12H =
      /(\d{1,2}(?::\d{2})?)\s*([aApP][.\s]*[mM][.\s]*)\s*(?:[-\u2013\u2014]|a\s+)(\d{1,2}(?::\d{2})?)\s*([aApP][.\s]*[mM][.\s]*)/g;
    const ranges12h = [...segment.matchAll(RANGE_12H)];
    if (ranges12h.length > 0) {
      const first = ranges12h[0];
      const last = ranges12h.at(-1)!;
      schedules.push({
        day,
        is_closed: false,
        opening_time: normalizeTime(first[1], first[2]),
        closing_time: normalizeTime(last[3], last[4]),
      });
      continue;
    }

    const match24h = segment.match(/(\d{1,2}:\d{2})\s*[-\u2013\u2014]\s*(\d{1,2}:\d{2})/);
    if (match24h) {
      schedules.push({
        day,
        is_closed: false,
        opening_time: normalizeTime(match24h[1], null),
        closing_time: normalizeTime(match24h[2], null),
      });
      continue;
    }

    const matchPlain = segment.match(/(\d{1,2}:\d{2})\s+a\s+(\d{1,2}:\d{2})/);
    if (matchPlain) {
      schedules.push({
        day,
        is_closed: false,
        opening_time: normalizeTime(matchPlain[1], null),
        closing_time: normalizeTime(matchPlain[2], null),
      });
    }
  }

  return schedules;
}
