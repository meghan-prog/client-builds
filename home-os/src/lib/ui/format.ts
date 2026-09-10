import { format, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";

export function mondayOfISO(dateISO: string): string {
  return format(startOfWeek(new Date(dateISO + "T00:00:00"), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function weekdayLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEEE", { locale: nl });
}

export function dayMonthLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM", { locale: nl });
}

export function fullDateLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEEE d MMMM yyyy", { locale: nl });
}

export function isoOf(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
