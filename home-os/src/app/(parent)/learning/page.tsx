import Link from "next/link";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getLearningGoalsForFamily } from "@/lib/data/learning";

export const dynamic = "force-dynamic";

export default async function LearningGoalsPage() {
  const familyId = await getPrimaryFamilyId();
  const goals = await getLearningGoalsForFamily(familyId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-sm font-medium text-ink-faint">Ontwikkeling</p>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl">Leerdoelen</h1>

      <div className="flex flex-col gap-3">
        {goals.map((goal) => (
          <Link key={goal.id} href={`/learning/${goal.id}`} className="card flex items-center gap-4 p-5 hover:shadow-md">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: goal.child.colorHex + "33" }}
            >
              {goal.child.avatarEmoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">🎯 {goal.title}</p>
              <p className="text-xs text-ink-faint">{goal.child.name}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(goal.progress * 100)}%` }} />
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold text-ink-soft">{Math.round(goal.progress * 100)}%</span>
          </Link>
        ))}
        {goals.length === 0 && <p className="text-sm text-ink-faint">Nog geen leerdoelen.</p>}
      </div>
    </div>
  );
}
