import { format, startOfWeek } from "date-fns";
import { prisma } from "@/lib/db";
import { getWeekPlanView } from "@/lib/data/planning";

export async function getChildDayChecklist(familyId: string, childId: string, dateISO: string) {
  const weekStart = format(startOfWeek(new Date(dateISO + "T00:00:00"), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { blocks } = await getWeekPlanView(familyId, weekStart);

  // Kid mode is deliberately curated, not a mirror of the parent's full plan:
  // the daily rhythm (routines/school) applies to everyone, but adult-only
  // categories (work, appointments) never belong on a child's screen, and
  // household tasks / learning activities only show up when they're
  // specifically this child's.
  const dayBlocks = blocks
    .filter((b) => format(b.date, "yyyy-MM-dd") === dateISO && !b.isFreeSpace)
    .filter((b) => b.category === "routine" || b.category === "school")
    .concat(
      blocks.filter(
        (b) =>
          format(b.date, "yyyy-MM-dd") === dateISO &&
          !b.isFreeSpace &&
          (b.category === "household" || b.category === "learning") &&
          b.childId === childId
      )
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const date = new Date(dateISO + "T00:00:00");

  const routineIds = dayBlocks.filter((b) => b.sourceType === "routine" && b.sourceId).map((b) => b.sourceId!);
  const routineCompletions = routineIds.length
    ? await prisma.routineCompletion.findMany({ where: { routineId: { in: routineIds }, childId, date } })
    : [];
  const doneRoutineIds = new Set(routineCompletions.map((rc) => rc.routineId));

  const taskIds = dayBlocks
    .filter((b) => b.sourceType === "household_task" && b.sourceId)
    .map((b) => b.sourceId!);
  const taskCompletions = taskIds.length
    ? await prisma.householdTaskCompletion.findMany({ where: { taskId: { in: taskIds }, date } })
    : [];
  const doneTaskIds = new Set(taskCompletions.map((tc) => tc.taskId));

  const scheduledActivityIds = dayBlocks
    .filter((b) => b.scheduledActivityId)
    .map((b) => b.scheduledActivityId!);
  const scheduledActivities = scheduledActivityIds.length
    ? await prisma.scheduledActivity.findMany({ where: { id: { in: scheduledActivityIds } } })
    : [];
  const doneActivityMap = new Map(scheduledActivities.map((sa) => [sa.id, sa.status === "done"]));

  return dayBlocks.map((b) => ({
    ...b,
    weekStart,
    done:
      b.sourceType === "routine"
        ? doneRoutineIds.has(b.sourceId ?? "")
        : b.sourceType === "household_task"
          ? doneTaskIds.has(b.sourceId ?? "")
          : b.sourceType === "scheduled_activity" && b.scheduledActivityId
            ? (doneActivityMap.get(b.scheduledActivityId) ?? false)
            : false,
  }));
}

export async function toggleRoutineCompletion(routineId: string, childId: string, dateISO: string) {
  const date = new Date(dateISO + "T00:00:00");
  const existing = await prisma.routineCompletion.findUnique({
    where: { routineId_childId_date: { routineId, childId, date } },
  });
  if (existing) {
    await prisma.routineCompletion.delete({ where: { id: existing.id } });
    return { done: false };
  }
  await prisma.routineCompletion.create({ data: { routineId, childId, date } });
  return { done: true };
}
