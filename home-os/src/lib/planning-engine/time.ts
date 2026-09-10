export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

export function durationMinutes(start: string, end: string): number {
  return toMinutes(end) - toMinutes(start);
}

export function isoWeekday(dateISO: string): number {
  // ISO: Monday = 1 .. Sunday = 7
  const d = new Date(dateISO + "T00:00:00");
  const jsDay = d.getDay(); // 0 = Sunday
  return jsDay === 0 ? 7 : jsDay;
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekDates(weekStartDateISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStartDateISO, i));
}
