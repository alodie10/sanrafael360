export type PeriodPreset = '7d' | '30d' | '90d' | 'custom';

export const PERIOD_PRESET_LABELS: Record<Exclude<PeriodPreset, 'custom'>, string> = {
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
};

export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function rangeFromPreset(preset: Exclude<PeriodPreset, 'custom'>): {
  startDate: string;
  endDate: string;
} {
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

export function daySpan(startDate: string, endDate: string): number {
  const a = new Date(`${startDate}T12:00:00`).getTime();
  const b = new Date(`${endDate}T12:00:00`).getTime();
  return Math.max(1, Math.round(Math.abs(b - a) / 86_400_000) + 1);
}

/** Infer chart tick density from span. */
export function chartDensity(startDate: string, endDate: string): '7d' | '30d' | '90d' {
  const days = daySpan(startDate, endDate);
  if (days <= 10) return '7d';
  if (days <= 45) return '30d';
  return '90d';
}
