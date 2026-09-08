import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getChildDayChecklist } from "@/lib/data/kids";
import { toggleHouseholdTaskAction, toggleRoutineAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function KidDayPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const familyId = await getPrimaryFamilyId();
  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });
  const todayISO = format(new Date(), "yyyy-MM-dd");
  const items = await getChildDayChecklist(familyId, childId, todayISO);

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="min-h-screen bg-bg px-4 py-6 md:px-8 md:py-10" style={{ backgroundColor: child.colorHex + "0D" }}>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/kids" className="text-sm text-ink-faint hover:text-ink-soft">
            ← Andere persoon
          </Link>
          <Link href="/week" className="text-sm text-ink-faint hover:text-ink-soft">
            Oudermodus
          </Link>
        </div>

        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
            style={{ backgroundColor: child.colorHex + "33" }}
          >
            {child.avatarEmoji}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Mijn dag</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {doneCount} van {items.length} gedaan
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const isRoutine = item.sourceType === "routine";
            const isTask = item.sourceType === "household_task";
            const isLearning = item.sourceType === "scheduled_activity";

            const body = (
              <div
                className={`flex w-full items-center gap-4 rounded-3xl border-2 p-5 text-left transition-colors ${
                  item.done
                    ? "border-sage bg-sage-soft"
                    : "border-border bg-surface hover:border-accent/50"
                }`}
              >
                <span className="text-4xl">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-lg font-semibold ${item.done ? "text-sage" : "text-ink"}`}>{item.title}</p>
                  <p className="text-xs text-ink-faint">{item.startTime}</p>
                </div>
                {item.done ? (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-xl text-white">
                    ✓
                  </span>
                ) : (
                  isLearning && <span className="shrink-0 text-sm text-ink-faint">Bekijk →</span>
                )}
              </div>
            );

            if (isLearning && item.scheduledActivityId) {
              return (
                <Link key={item.id} href={`/activity/${item.scheduledActivityId}`}>
                  {body}
                </Link>
              );
            }

            if (isRoutine && item.sourceId) {
              return (
                <form key={item.id} action={toggleRoutineAction.bind(null, item.sourceId, childId, todayISO)}>
                  <button type="submit" className="block w-full">
                    {body}
                  </button>
                </form>
              );
            }

            if (isTask && item.sourceId) {
              return (
                <form
                  key={item.id}
                  action={toggleHouseholdTaskAction.bind(null, item.sourceId, todayISO, childId)}
                >
                  <button type="submit" className="block w-full">
                    {body}
                  </button>
                </form>
              );
            }

            return <div key={item.id}>{body}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
