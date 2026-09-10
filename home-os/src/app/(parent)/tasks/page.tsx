import { format, startOfWeek } from "date-fns";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getHouseholdTasksForDate } from "@/lib/data/shopping-tasks";
import { weekDates } from "@/lib/planning-engine";
import { capitalize, weekdayLabel } from "@/lib/ui/format";
import { toggleHouseholdTaskAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const familyId = await getPrimaryFamilyId();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const dates = weekDates(weekStart);

  const perDay = await Promise.all(dates.map((d) => getHouseholdTasksForDate(familyId, d)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-sm font-medium text-ink-faint">Huishouden</p>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl">Taken deze week</h1>

      <div className="flex flex-col gap-6">
        {dates.map((d, i) => {
          const tasks = perDay[i];
          if (tasks.length === 0) return null;
          return (
            <div key={d} className="card p-4 md:p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink">
                {capitalize(weekdayLabel(d))} <span className="font-normal text-ink-faint">{d}</span>
              </h2>
              <div className="flex flex-col gap-2">
                {tasks.map((t) => (
                  <form key={t.id} action={toggleHouseholdTaskAction.bind(null, t.id, d, t.assignedChildId)}>
                    <button
                      type="submit"
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        t.isDoneToday ? "border-sage bg-sage-soft" : "border-border bg-surface hover:bg-surface-muted"
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className={`flex-1 text-sm font-medium ${t.isDoneToday ? "text-sage" : "text-ink"}`}>
                        {t.title}
                      </span>
                      <span className="text-xs text-ink-faint">{t.preferredTime}</span>
                      {t.isDoneToday && <span className="text-sage">✓</span>}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
