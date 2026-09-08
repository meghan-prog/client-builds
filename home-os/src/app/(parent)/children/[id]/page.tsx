import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getChildDetail, ageFromBirthDate } from "@/lib/data/children";
import { getChildScheduledActivities } from "@/lib/data/learning";

export const dynamic = "force-dynamic";

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { child, householdTasks } = await getChildDetail(id);
  const activities = await getChildScheduledActivities(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <Link href="/children" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        ← Kinderen
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-4xl"
          style={{ backgroundColor: child.colorHex + "33" }}
        >
          {child.avatarEmoji}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{child.name}</h1>
          <p className="text-sm text-ink-faint">{ageFromBirthDate(child.birthDate)} jaar</p>
        </div>
        <Link
          href={`/kids/${child.id}`}
          className="ml-auto rounded-full bg-sage-soft px-4 py-2 text-sm font-semibold text-sage hover:opacity-90"
        >
          🧸 Open kindmodus
        </Link>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Leerdoelen</h2>
        <div className="flex flex-col gap-3">
          {child.learningGoals.map((goal) => (
            <Link key={goal.id} href={`/learning/${goal.id}`} className="card flex items-center gap-4 p-4 hover:shadow-md">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">🎯 {goal.title}</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(goal.progress * 100)}%` }} />
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-soft">{Math.round(goal.progress * 100)}%</span>
            </Link>
          ))}
          {child.learningGoals.length === 0 && <p className="text-sm text-ink-faint">Nog geen leerdoelen ingesteld.</p>}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Taken</h2>
        <div className="flex flex-wrap gap-2">
          {householdTasks.map((t) => (
            <span key={t.id} className="flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-sm text-ink">
              {t.icon} {t.title}
            </span>
          ))}
          {householdTasks.length === 0 && <p className="text-sm text-ink-faint">Geen vaste taken toegewezen.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Recente activiteiten</h2>
        <div className="flex flex-col gap-2">
          {activities.slice(0, 8).map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <span className="text-lg">{a.learningActivity.icon}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{a.learningActivity.title}</span>
              <span className="shrink-0 text-xs text-ink-faint">{format(a.date, "d MMM", { locale: nl })}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.status === "done" ? "bg-sage-soft text-sage" : "bg-surface-muted text-ink-soft"}`}>
                {a.status === "done" ? "Afgerond" : "Gepland"}
              </span>
            </div>
          ))}
          {activities.length === 0 && <p className="text-sm text-ink-faint">Nog geen activiteiten gepland.</p>}
        </div>
      </section>
    </div>
  );
}
