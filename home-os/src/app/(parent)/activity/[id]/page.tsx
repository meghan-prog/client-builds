import Link from "next/link";
import { getScheduledActivityDetail } from "@/lib/data/learning";
import { getThemeByKey } from "@/lib/themes/catalog";
import { completeActivityAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { id } = await params;
  const { week } = await searchParams;
  const { scheduledActivity, instructions, materials } = await getScheduledActivityDetail(id);
  const activity = scheduledActivity.learningActivity;
  const skill = activity.skill;
  const goal = skill.goal;
  const isDone = scheduledActivity.status === "done";
  const missingMaterials = materials.filter((m) => m.status === "missing");
  const theme = activity.themeKey ? getThemeByKey(activity.themeKey) : undefined;

  const backHref = week ? `/week/${week}` : "/learning";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-10">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        ← Terug
      </Link>

      <div className="mb-4 flex items-center gap-2 text-xs text-ink-faint">
        <Link href={`/learning/${goal.id}`} className="rounded-full bg-surface-muted px-2.5 py-1 hover:text-ink">
          🎯 {goal.title}
        </Link>
        <span>›</span>
        <span className="rounded-full bg-surface-muted px-2.5 py-1">{skill.title}</span>
        {theme && (
          <span className="rounded-full bg-[#FBF1DE] px-2.5 py-1 font-medium text-[#8A6A25]">
            {theme.icon} {theme.title}
          </span>
        )}
      </div>

      <div className="card p-5 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              <span>{activity.icon}</span>
              {activity.title}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              voor {scheduledActivity.child.name} · {scheduledActivity.startTime}–{scheduledActivity.endTime}
            </p>
          </div>
          {isDone && (
            <span className="shrink-0 rounded-full bg-sage-soft px-3 py-1.5 text-xs font-semibold text-sage">
              ✓ Afgerond
            </span>
          )}
        </div>

        <section className="mb-6">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Doel</h2>
          <p className="text-sm text-ink">{skill.title}</p>
        </section>

        <div className="mb-6 flex gap-6">
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Duur</h2>
            <p className="text-sm text-ink">{activity.durationMinutes} minuten</p>
          </div>
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Voorbereiding</h2>
            <p className="text-sm text-ink">{activity.prepMinutes > 0 ? `${activity.prepMinutes} minuten` : "Geen"}</p>
          </div>
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Locatie</h2>
            <p className="text-sm text-ink">{activity.location}</p>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Wat ga je doen?</h2>
          <ol className="flex flex-col gap-2">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface-muted p-3 text-sm text-ink">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Wat heb je nodig?</h2>
          <div className="flex flex-wrap gap-2">
            {materials.map((m) => (
              <span
                key={m.id}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                  m.status === "missing"
                    ? "border-[#F0C7C1] bg-[#FBE7E5] text-[#A1443A]"
                    : "border-border bg-surface-muted text-ink"
                }`}
              >
                {m.status === "missing" ? "✗" : "✓"} {m.name}
              </span>
            ))}
            {materials.length === 0 && <p className="text-sm text-ink-faint">Geen materiaal nodig.</p>}
          </div>
          {missingMaterials.length > 0 && (
            <p className="mt-2 text-sm text-ink-soft">
              Ontbrekend materiaal staat op je{" "}
              <Link href="/shopping" className="font-medium text-accent underline">
                boodschappenlijst
              </Link>
              .
            </p>
          )}
        </section>

        <form action={completeActivityAction.bind(null, scheduledActivity.id, !isDone, week)}>
          <button
            type="submit"
            className={`w-full rounded-full px-5 py-3.5 text-center text-sm font-semibold shadow-sm ${
              isDone ? "border border-border bg-surface text-ink-soft hover:bg-surface-muted" : "bg-accent text-white hover:opacity-90"
            }`}
          >
            {isDone ? "Markeer als niet afgerond" : "✓ Activiteit afgerond"}
          </button>
        </form>
      </div>
    </div>
  );
}
