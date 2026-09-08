import type { ActiveTheme } from "@/lib/themes/catalog";

const CATEGORY_LABEL: Record<ActiveTheme["category"], string> = {
  holiday: "Feestdag",
  tradition: "Traditie",
  season: "Seizoen",
  harvest: "Oogst",
};

const COUNTRY_FLAG: Record<ActiveTheme["country"], string> = {
  NL: "🇳🇱",
  ES: "🇪🇸",
  both: "🇳🇱🇪🇸",
};

export default function ThemeCard({ themes, upcoming = [] }: { themes: ActiveTheme[]; upcoming?: ActiveTheme[] }) {
  if (themes.length === 0 && upcoming.length === 0) return null;

  return (
    <div className="mb-6 card p-4 md:p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Dit seizoen</h2>
      {themes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {themes.map((t) => (
            <span
              key={t.key}
              title={t.description}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-sm text-ink"
            >
              <span>{t.icon}</span>
              <span className="font-medium">{t.title}</span>
              <span className="text-xs text-ink-faint">
                {COUNTRY_FLAG[t.country]} · {CATEGORY_LABEL[t.category]}
              </span>
            </span>
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {upcoming.map((t) => (
            <span
              key={t.key}
              title={t.description}
              className="flex items-center gap-1.5 rounded-full bg-[#FBF1DE] px-3 py-1 text-xs font-medium text-[#8A6A25]"
            >
              <span>{t.icon}</span>
              {t.title} over {t.daysUntil} {t.daysUntil === 1 ? "dag" : "dagen"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
