// Cultural & seasonal theme catalog — abstraction layer, same spirit as
// lib/ai/*: a static reference dataset today, swappable later for a richer
// source (a maintained holiday API, regional school-holiday feeds, etc.)
// without touching any caller, since everyone only depends on the
// `getThemesForRange` / `getUpcomingThemes` functions below.
//
// Covers what a bicultural NL/ES family actually tracks: Dutch and Spanish
// public holidays & traditions, the meteorological seasons (NL climate),
// and Spanish harvest windows — used to give the "wat is er anders" /
// learning-goal picture cultural and seasonal context, not just school +
// work + household.

export type ThemeCategory = "holiday" | "tradition" | "season" | "harvest";
export type ThemeCountry = "NL" | "ES" | "both";

export interface ThemeDef {
  key: string;
  title: string;
  icon: string;
  category: ThemeCategory;
  country: ThemeCountry;
  /** 1-indexed month/day, year-agnostic — the range recurs every year. */
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  description: string;
}

export const THEME_CATALOG: ThemeDef[] = [
  // --- Seizoenen (meteorologisch, NL) ---
  { key: "lente", title: "Lente", icon: "🌱", category: "season", country: "NL", startMonth: 3, startDay: 1, endMonth: 5, endDay: 31, description: "Meteorologische lente." },
  { key: "zomer", title: "Zomer", icon: "☀️", category: "season", country: "NL", startMonth: 6, startDay: 1, endMonth: 8, endDay: 31, description: "Meteorologische zomer." },
  { key: "herfst_nl", title: "Herfst", icon: "🍂", category: "season", country: "NL", startMonth: 9, startDay: 1, endMonth: 11, endDay: 30, description: "Meteorologische herfst — bladeren, kastanjes, korter licht." },
  { key: "winter", title: "Winter", icon: "❄️", category: "season", country: "NL", startMonth: 12, startDay: 1, endMonth: 2, endDay: 28, description: "Meteorologische winter." },

  // --- Nederlandse feestdagen & tradities ---
  { key: "sinterklaas_intocht", title: "Pakjestijd", icon: "🎁", category: "tradition", country: "NL", startMonth: 11, startDay: 16, endMonth: 12, endDay: 5, description: "Van intocht tot pakjesavond." },
  { key: "sinterklaas", title: "Sinterklaas", icon: "🎅🏻", category: "tradition", country: "NL", startMonth: 12, startDay: 5, endMonth: 12, endDay: 5, description: "Pakjesavond." },
  { key: "kerst_nl", title: "Kerst", icon: "🎄", category: "holiday", country: "NL", startMonth: 12, startDay: 25, endMonth: 12, endDay: 26, description: "Eerste en tweede kerstdag." },
  { key: "oudjaar", title: "Oud & Nieuw", icon: "🎆", category: "holiday", country: "NL", startMonth: 12, startDay: 31, endMonth: 1, endDay: 1, description: "Jaarwisseling." },
  { key: "koningsdag", title: "Koningsdag", icon: "🧡", category: "holiday", country: "NL", startMonth: 4, startDay: 27, endMonth: 4, endDay: 27, description: "Nationale feestdag." },

  // --- Spaanse feestdagen & tradities ---
  { key: "reyes", title: "Reyes Magos", icon: "👑", category: "tradition", country: "ES", startMonth: 1, startDay: 5, endMonth: 1, endDay: 6, description: "Driekoningen — het Spaanse cadeaufeest." },
  { key: "hispanidad", title: "Día de la Hispanidad", icon: "🇪🇸", category: "holiday", country: "ES", startMonth: 10, startDay: 12, endMonth: 10, endDay: 12, description: "Spaanse nationale feestdag." },
  { key: "navidad_es", title: "Navidad", icon: "🎄", category: "holiday", country: "ES", startMonth: 12, startDay: 25, endMonth: 12, endDay: 25, description: "Kerst in Spanje." },
  { key: "nochevieja", title: "Nochevieja", icon: "🍇", category: "tradition", country: "ES", startMonth: 12, startDay: 31, endMonth: 12, endDay: 31, description: "Oudejaarsavond — twaalf druiven bij twaalf klokslagen." },

  // --- Spaanse oogsttijden ---
  { key: "vendimia", title: "Vendimia (druivenoogst)", icon: "🍇", category: "harvest", country: "ES", startMonth: 9, startDay: 1, endMonth: 10, endDay: 15, description: "Druivenoogst in de Spaanse wijngebieden." },
  { key: "aceituna", title: "Aceituna (olijvenoogst)", icon: "🫒", category: "harvest", country: "ES", startMonth: 11, startDay: 15, endMonth: 12, endDay: 31, description: "Olijvenoogst, vooral in Andalusië." },
  { key: "naranjas", title: "Sinaasappeloogst", icon: "🍊", category: "harvest", country: "ES", startMonth: 12, startDay: 1, endMonth: 2, endDay: 28, description: "Citrusoogst, o.a. in Valencia." },
];

function monthDayToDayOfYear(month: number, day: number): number {
  // Fixed non-leap reference; only used for relative ordering within a year, so leap days don't matter here.
  const cumulative = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return cumulative[month - 1] + day;
}

/** Expands a possibly year-wrapping (Dec -> Jan) theme range into 1 or 2 non-wrapping [start,end] day-of-year spans. */
function themeSpans(theme: ThemeDef): [number, number][] {
  const start = monthDayToDayOfYear(theme.startMonth, theme.startDay);
  const end = monthDayToDayOfYear(theme.endMonth, theme.endDay);
  if (start <= end) return [[start, end]];
  return [
    [start, 366],
    [1, end],
  ];
}

function isDateInTheme(date: Date, theme: ThemeDef): boolean {
  const doy = monthDayToDayOfYear(date.getMonth() + 1, date.getDate());
  return themeSpans(theme).some(([s, e]) => doy >= s && doy <= e);
}

export interface ActiveTheme extends ThemeDef {
  /** null when the theme is already active within the queried range */
  daysUntil: number | null;
}

/**
 * Every theme whose recurring annual window overlaps the given ISO date
 * range. Walks day by day (a week or month view is at most ~31 days) rather
 * than comparing year-scoped spans, so a range that crosses a calendar-year
 * boundary (e.g. the week around New Year's) still matches correctly.
 */
export function getThemesForRange(startISO: string, endISO: string): ActiveTheme[] {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  const matched = new Set<string>();

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    for (const theme of THEME_CATALOG) {
      if (isDateInTheme(d, theme)) matched.add(theme.key);
    }
  }

  return THEME_CATALOG.filter((t) => matched.has(t.key))
    .map((t) => ({ ...t, daysUntil: null }))
    .sort((a, b) => a.startMonth - b.startMonth || a.startDay - b.startDay);
}

/** Themes starting within `withinDays` of `fromISO` (not yet active on that date) — for a "coming up" nudge. */
export function getUpcomingThemes(fromISO: string, withinDays: number): ActiveTheme[] {
  const from = new Date(fromISO + "T00:00:00");
  const activeNow = new Set(getThemesForRange(fromISO, fromISO).map((t) => t.key));
  const results: ActiveTheme[] = [];

  for (const theme of THEME_CATALOG) {
    if (activeNow.has(theme.key)) continue;
    for (const deltaYear of [0, 1]) {
      const candidate = new Date(from.getFullYear() + deltaYear, theme.startMonth - 1, theme.startDay);
      const diffDays = Math.round((candidate.getTime() - from.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays <= withinDays) {
        results.push({ ...theme, daysUntil: diffDays });
        break;
      }
    }
  }

  return results.sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));
}

export function getThemeByKey(key: string): ThemeDef | undefined {
  return THEME_CATALOG.find((t) => t.key === key);
}
