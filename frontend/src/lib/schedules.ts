export interface BusinessSchedule {
  day: string;
  opening_time?: string | null;
  closing_time?: string | null;
  is_closed?: boolean;
}

export function getOpenSchedulesForDay(
  schedules: BusinessSchedule[] | undefined,
  day: string
): BusinessSchedule[] {
  return (schedules || [])
    .filter(
      (schedule) =>
        schedule.day === day &&
        !schedule.is_closed &&
        schedule.opening_time &&
        schedule.closing_time
    )
    .sort((a, b) =>
      (a.opening_time || "").localeCompare(b.opening_time || "")
    );
}

export function isOpenDuringAnySchedule(
  schedules: BusinessSchedule[],
  currentMinutes: number
): boolean {
  return schedules.some((schedule) => {
    const open = toMinutes(schedule.opening_time);
    const close = toMinutes(schedule.closing_time);
    if (open === null || close === null) return false;

    return close < open
      ? currentMinutes >= open || currentMinutes <= close
      : currentMinutes >= open && currentMinutes <= close;
  });
}

function toMinutes(time?: string | null): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}
