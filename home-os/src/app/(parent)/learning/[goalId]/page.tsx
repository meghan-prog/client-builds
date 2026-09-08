import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getLearningGoalDetail } from "@/lib/data/learning";

export const dynamic = "force-dynamic";

export default async function LearningGoalDetailPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params;
  const { goal, monthSkills, weekSkills } = await getLearningGoalDetail(goalId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <Link href="/learning" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        ← Leerdoelen
      </Link>

      <div className="card mb-6 p-5 md:p-6">
        <p className="text-xs font-medium text-ink-faint">{goal.child.name}</p>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">🎯 {goal.title}</h1>
        {goal.description && <p className="mb-3 text-sm text-ink-soft">{goal.description}</p>}
        <div className="flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(goal.progress * 100)}%` }} />
          </div>
          <span className="text-sm font-semibold text-ink-soft">{Math.round(goal.progress * 100)}%</span>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          {format(goal.startDate, "d MMM yyyy", { locale: nl })} — {format(goal.endDate, "d MMM yyyy", { locale: nl })}
        </p>
      </div>

      {monthSkills.map((month) => {
        const weeksInMonth = weekSkills.filter((w) => w.parentSkillId === month.id);
        return (
          <div key={month.id} className="card mb-4 p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">📅 Deze maand: {month.title}</h2>
              <span className="text-xs font-semibold text-ink-soft">{Math.round(month.progress * 100)}%</span>
            </div>
            <div className="flex flex-col gap-3">
              {weeksInMonth.map((week) => (
                <div key={week.id} className="rounded-xl bg-surface-muted p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Week van {format(week.periodStart, "d MMM", { locale: nl })}: {week.title}
                    </p>
                    <span className="text-xs text-ink-faint">{Math.round(week.progress * 100)}%</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {week.activities.map((act) => {
                      const done = act.scheduledInstances.some((si) => si.status === "done");
                      const instance = act.scheduledInstances[0];
                      const body = (
                        <span
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                            done ? "border-sage bg-sage-soft text-sage" : "border-border bg-surface text-ink"
                          }`}
                        >
                          {done ? "✓" : act.icon} {act.title}
                        </span>
                      );
                      return instance ? (
                        <Link key={act.id} href={`/activity/${instance.id}`}>
                          {body}
                        </Link>
                      ) : (
                        <span key={act.id}>{body}</span>
                      );
                    })}
                  </div>
                </div>
              ))}
              {weeksInMonth.length === 0 && <p className="text-xs text-ink-faint">Nog geen weekdoel voor deze maand.</p>}
            </div>
          </div>
        );
      })}
      {monthSkills.length === 0 && <p className="text-sm text-ink-faint">Nog geen maanddoelen uitgewerkt.</p>}
    </div>
  );
}
