import Link from "next/link";
import { format } from "date-fns";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getWeekPlanView } from "@/lib/data/planning";
import { categoryStyle } from "@/lib/ui/category-styles";
import { capitalize, fullDateLabel } from "@/lib/ui/format";
import { toggleHouseholdTaskAction } from "@/app/actions";
import type { BlockCategory } from "@/lib/planning-engine";

export const dynamic = "force-dynamic";

export default async function DayPage({
  params,
}: {
  params: Promise<{ weekStart: string; date: string }>;
}) {
  const { weekStart, date } = await params;
  const familyId = await getPrimaryFamilyId();
  const { blocks } = await getWeekPlanView(familyId, weekStart);

  const dayBlocks = blocks
    .filter((b) => format(b.date, "yyyy-MM-dd") === date)
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const freeBlock = dayBlocks.find((b) => b.isFreeSpace);
  const inFreeWindow = (b: (typeof dayBlocks)[number]) =>
    freeBlock && !b.isFreeSpace && b.startTime >= freeBlock.startTime && b.startTime < freeBlock.endTime;

  const before = dayBlocks.filter((b) => !b.isFreeSpace && (!freeBlock || !inFreeWindow(b)) && b.startTime < (freeBlock?.startTime ?? "99:99"));
  const afternoon = freeBlock ? dayBlocks.filter((b) => !b.isFreeSpace && inFreeWindow(b)) : [];
  const after = dayBlocks.filter(
    (b) => !b.isFreeSpace && (!freeBlock || (!inFreeWindow(b) && b.startTime >= freeBlock.endTime))
  );

  function Row({ block }: { block: (typeof dayBlocks)[number] }) {
    const style = categoryStyle(block.category as BlockCategory);
    const content = (
      <div
        className={`flex items-center gap-3 rounded-xl border p-3 ${style.bg} ${style.border} ${
          block.hasConflict ? "ring-1 ring-danger" : ""
        }`}
      >
        <span className="w-14 shrink-0 font-mono text-xs text-ink-soft">{block.startTime}</span>
        <span className="text-xl">{block.icon}</span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${style.text}`}>{block.title}</p>
          {block.child && <p className="text-xs text-ink-faint">{block.child.name}</p>}
        </div>
        {block.hasConflict && <span className="shrink-0 text-sm">⚠️</span>}
        {block.category === "learning" && <span className="shrink-0 text-xs text-ink-faint">Bekijk →</span>}
      </div>
    );

    if (block.category === "learning" && block.scheduledActivityId) {
      return (
        <Link key={block.id} href={`/activity/${block.scheduledActivityId}?week=${weekStart}`} className="block">
          {content}
        </Link>
      );
    }

    if (block.category === "household" && block.householdTaskId) {
      return (
        <form key={block.id} action={toggleHouseholdTaskAction.bind(null, block.householdTaskId, date, block.childId)}>
          <button type="submit" className="block w-full text-left">
            {content}
          </button>
        </form>
      );
    }

    return <div key={block.id}>{content}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <Link href={`/week/${weekStart}`} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        ← Terug naar week
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
        {capitalize(fullDateLabel(date))}
      </h1>

      <div className="flex flex-col gap-2">
        {before.map((b) => (
          <Row key={b.id} block={b} />
        ))}
      </div>

      {freeBlock && (
        <div className="my-4 rounded-2xl border border-dashed border-[#CBDFCF] bg-[#F6F8F4] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#5E7A64]">
              🌿 {freeBlock.title} · {freeBlock.startTime}–{freeBlock.endTime}
            </h2>
            <span className="text-xs text-[#5E7A64]">Beschermde vrije ruimte</span>
          </div>
          <div className="flex flex-col gap-2">
            {afternoon.length > 0 ? (
              afternoon.map((b) => <Row key={b.id} block={b} />)
            ) : (
              <p className="text-sm text-[#5E7A64]">Nog helemaal vrij — geen ingeplande activiteiten.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {after.map((b) => (
          <Row key={b.id} block={b} />
        ))}
      </div>
    </div>
  );
}
