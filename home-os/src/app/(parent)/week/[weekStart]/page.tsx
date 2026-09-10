import Link from "next/link";
import { addDays, format } from "date-fns";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getChildrenForFamily } from "@/lib/data/children";
import { getWeekPlanView, getWeeklyIntention } from "@/lib/data/planning";
import { getThemesForRange, getUpcomingThemes } from "@/lib/themes/catalog";
import { weekDates } from "@/lib/planning-engine";
import { categoryStyle } from "@/lib/ui/category-styles";
import { capitalize, dayMonthLabel, weekdayLabel } from "@/lib/ui/format";
import SchoolCancellationQuickReport from "@/components/SchoolCancellationQuickReport";
import ThemeCard from "@/components/ThemeCard";
import {
  acceptConflictAction,
  dismissConflictAction,
  regenerateWeekPlanAction,
  saveIntentionAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function WeekPage({ params }: { params: Promise<{ weekStart: string }> }) {
  const { weekStart } = await params;
  const familyId = await getPrimaryFamilyId();
  const { blocks, conflicts, deviations } = await getWeekPlanView(familyId, weekStart);
  const intention = await getWeeklyIntention(familyId, weekStart);
  const children = await getChildrenForFamily(familyId);

  const dates = weekDates(weekStart);
  const weekEnd = dates[6];
  const themes = getThemesForRange(dates[0], weekEnd);
  const upcomingThemes = getUpcomingThemes(weekEnd, 21).filter((u) => !themes.some((t) => t.key === u.key));
  const prevWeek = format(addDays(new Date(weekStart + "T00:00:00"), -7), "yyyy-MM-dd");
  const nextWeek = format(addDays(new Date(weekStart + "T00:00:00"), 7), "yyyy-MM-dd");
  const todayISO = format(new Date(), "yyyy-MM-dd");

  const openConflicts = conflicts.filter((c) => c.status === "open");

  const blocksByDate = new Map<string, typeof blocks>();
  for (const d of dates) blocksByDate.set(d, []);
  for (const b of blocks) {
    const key = format(b.date, "yyyy-MM-dd");
    blocksByDate.get(key)?.push(b);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-faint">Weekoverzicht</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            {dayMonthLabel(weekStart)} — {dayMonthLabel(weekEnd)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/week/${prevWeek}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink-soft hover:bg-surface-muted"
          >
            ←
          </Link>
          <Link
            href={`/week/${nextWeek}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink-soft hover:bg-surface-muted"
          >
            →
          </Link>
          <form action={regenerateWeekPlanAction.bind(null, weekStart)}>
            <button
              type="submit"
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              ✨ Genereer opnieuw
            </button>
          </form>
          <SchoolCancellationQuickReport familyChildren={children.map((c) => ({ id: c.id, name: c.name }))} />
        </div>
      </div>

      <ThemeCard themes={themes} upcoming={upcomingThemes} />

      {/* Deze week anders */}
      {deviations.length > 0 && (
        <div className="mb-6 card p-4 md:p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Deze week anders</h2>
          <div className="flex flex-wrap gap-2">
            {deviations.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-sm text-ink"
              >
                <span>{d.icon}</span>
                <span className="font-medium">{capitalize(weekdayLabel(d.date))}</span>
                <span className="text-ink-soft">— {d.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {openConflicts.length > 0 && (
        <div className="mb-6 card border-danger/30 p-4 md:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-danger">
            ⚠️ Conflicten gevonden
          </h2>
          <div className="flex flex-col gap-3">
            {openConflicts.map((c) => {
              const suggestion = c.suggestion
                ? (JSON.parse(c.suggestion) as { description: string; segments: unknown[] })
                : null;
              return (
                <div key={c.id} className="rounded-xl border border-[#F0C7C1] bg-[#FBE7E5] p-3">
                  <p className="text-sm font-medium text-ink">
                    {capitalize(weekdayLabel(c.date))} {dayMonthLabel(c.date)}: {c.description}
                  </p>
                  {suggestion && (
                    <p className="mt-1 text-sm text-ink-soft">💡 Voorstel: {suggestion.description}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <form action={acceptConflictAction.bind(null, c.id, weekStart)}>
                      <button
                        type="submit"
                        className="rounded-full bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Accepteer voorstel
                      </button>
                    </form>
                    <form action={dismissConflictAction.bind(null, c.id, weekStart)}>
                      <button
                        type="submit"
                        className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface-muted"
                      >
                        Zelf aanpassen
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {dates.map((d) => {
          const dayBlocks = (blocksByDate.get(d) ?? []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
          const isToday = d === todayISO;
          return (
            <Link
              key={d}
              href={`/week/${weekStart}/${d}`}
              className={`card flex flex-col p-3 transition-shadow hover:shadow-md ${
                isToday ? "ring-2 ring-accent" : ""
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {weekdayLabel(d)}
                  </p>
                  <p className="text-sm font-semibold text-ink">{dayMonthLabel(d)}</p>
                </div>
                {isToday && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">VANDAAG</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {dayBlocks
                  .filter((b) => !b.isFreeSpace)
                  .slice(0, 7)
                  .map((b) => {
                    const style = categoryStyle(b.category as never);
                    return (
                      <div
                        key={b.id}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs ${style.bg} ${style.text}`}
                      >
                        <span className="shrink-0 font-mono text-[10px] opacity-70">{b.startTime}</span>
                        <span className="shrink-0">{b.icon}</span>
                        <span className="truncate font-medium">{b.title}</span>
                        {b.hasConflict && <span className="ml-auto shrink-0">⚠️</span>}
                      </div>
                    );
                  })}
                {dayBlocks.filter((b) => !b.isFreeSpace).length > 7 && (
                  <p className="px-2 pt-1 text-[11px] text-ink-faint">
                    +{dayBlocks.filter((b) => !b.isFreeSpace).length - 7} meer
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Sunday / weekly intentions */}
      <div className="mt-8 card p-4 md:p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">Zondagse input</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Wat moet er deze week extra gebeuren? Schrijf het gewoon op — Home OS verwerkt het in de planning.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            const text = String(formData.get("rawText") ?? "");
            await saveIntentionAction(weekStart, text);
          }}
          className="flex flex-col gap-3"
        >
          <textarea
            name="rawText"
            defaultValue={intention?.rawText ?? ""}
            rows={3}
            placeholder="Bijv. 'Woensdag wil ik met de kinderen naar het strand. Dinsdag moet ik naar de tandarts.'"
            className="w-full resize-none rounded-xl border border-border bg-surface p-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <div>
            <button
              type="submit"
              className="rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              Verwerk in planning
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
