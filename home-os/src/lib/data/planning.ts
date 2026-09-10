import { format } from "date-fns";
import { prisma } from "@/lib/db";
import {
  generateWeekPlan,
  isoWeekday,
  weekDates,
  type CalendarEventInput,
  type FlexibleIntentionItem,
  type HouseholdTaskInput,
  type LearningActivityCandidateInput,
  type RoutineInput,
  type SchoolEventInput,
  type WeekPlanEngineInput,
  type Weekday,
  type WorkBlockInstanceInput,
} from "@/lib/planning-engine";
import { getIntentionParsingService } from "@/lib/ai/intention-parser";

const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

async function buildEngineInputForWeek(familyId: string, weekStartISO: string): Promise<WeekPlanEngineInput> {
  const dates = weekDates(weekStartISO);
  const weekEndISO = dates[6];
  const weekStartDate = new Date(weekStartISO + "T00:00:00");
  const weekEndDate = new Date(weekEndISO + "T23:59:59");

  const family = await prisma.family.findUniqueOrThrow({
    where: { id: familyId },
    include: {
      children: true,
      parents: { include: { workProfiles: { include: { blocks: true } } } },
      routines: { where: { isActive: true }, include: { children: true } },
      householdTasks: true,
      schoolYears: { include: { events: true } },
      calendars: { include: { events: true } },
    },
  });

  const routines: RoutineInput[] = family.routines.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    icon: r.icon,
    startTime: r.startTime,
    endTime: r.endTime,
    daysOfWeek: JSON.parse(r.daysOfWeek) as Weekday[],
    childIds: r.children.map((c) => c.childId),
    isFreeSpaceBlock: r.isFreeSpaceBlock,
  }));

  const schoolEvents: SchoolEventInput[] = [];
  for (const sy of family.schoolYears) {
    for (const e of sy.events) {
      const startISO = isoDate(e.startDate);
      const endISO = isoDate(e.endDate);
      if (endISO < weekStartISO || startISO > weekEndISO) continue;
      schoolEvents.push({
        id: e.id,
        childId: e.childId,
        type: e.type as SchoolEventInput["type"],
        title: e.title,
        startDate: startISO,
        endDate: endISO,
      });
    }
  }

  const calendarEvents: CalendarEventInput[] = [];
  for (const cal of family.calendars) {
    for (const ce of cal.events) {
      const d = isoDate(ce.date);
      if (d < weekStartISO || d > weekEndISO) continue;
      calendarEvents.push({
        id: ce.id,
        title: ce.title,
        type: ce.type as CalendarEventInput["type"],
        date: d,
        startTime: ce.startTime ?? undefined,
        endTime: ce.endTime ?? undefined,
      });
    }
  }

  const workBlocks: WorkBlockInstanceInput[] = [];
  for (const p of family.parents) {
    const defaultProfile = p.workProfiles.find((wp) => wp.isDefault);
    const allBlocks = p.workProfiles.flatMap((wp) => wp.blocks);
    const dateOverrides = allBlocks.filter((b) => b.date && dates.includes(isoDate(b.date)));
    const overriddenDates = new Set(dateOverrides.map((b) => isoDate(b.date!)));

    if (defaultProfile) {
      for (const b of defaultProfile.blocks.filter((b) => b.dayOfWeek != null)) {
        for (const d of dates) {
          if (isoWeekday(d) === b.dayOfWeek && !overriddenDates.has(d)) {
            workBlocks.push({
              id: `${b.id}-${d}`,
              parentName: p.name,
              date: d,
              startTime: b.startTime,
              endTime: b.endTime,
              label: b.label,
              isDefault: true,
            });
          }
        }
      }
    }
    for (const b of dateOverrides) {
      workBlocks.push({
        id: b.id,
        parentName: p.name,
        date: isoDate(b.date!),
        startTime: b.startTime,
        endTime: b.endTime,
        label: b.label,
        isDefault: false,
      });
    }
  }

  const householdTasks: HouseholdTaskInput[] = family.householdTasks.map((t) => ({
    id: t.id,
    title: t.title,
    icon: t.icon,
    daysOfWeek: JSON.parse(t.daysOfWeek) as Weekday[],
    preferredTime: t.preferredTime,
    durationMinutes: t.durationMinutes,
    isRequired: t.isRequired,
    assignedChildId: t.assignedChildId,
  }));

  // Learning candidates: week-level goal breakdowns overlapping this week,
  // minus activities already scheduled (any status) for their child this week —
  // those are re-attached to the plan separately so completion state survives
  // a regeneration instead of being re-planned.
  const weekSkills = await prisma.learningSkill.findMany({
    where: {
      period: "week",
      goal: { child: { familyId } },
      periodStart: { lte: weekEndDate },
      periodEnd: { gte: weekStartDate },
    },
    include: { activities: true, goal: { include: { child: true } } },
  });

  const learningCandidates: LearningActivityCandidateInput[] = [];
  for (const skill of weekSkills) {
    for (const act of skill.activities) {
      const existing = await prisma.scheduledActivity.findFirst({
        where: {
          learningActivityId: act.id,
          childId: skill.goal.childId,
          date: { gte: weekStartDate, lte: weekEndDate },
        },
      });
      if (existing) continue;
      learningCandidates.push({
        id: act.id,
        childId: skill.goal.childId,
        title: act.title,
        icon: act.icon,
        durationMinutes: act.durationMinutes,
        skillTitle: skill.title,
        goalTitle: skill.goal.title,
        goalId: skill.goal.id,
        skillId: skill.id,
        timesNeeded: 1,
        preferredWeekday: (act.preferredWeekday as Weekday | null) ?? undefined,
      });
    }
  }

  const intentionRow = await prisma.weeklyIntention.findFirst({
    where: { familyId, weekStartDate },
    orderBy: { createdAt: "desc" },
  });
  let intentionItems: FlexibleIntentionItem[] = [];
  if (intentionRow?.parsedItems) {
    intentionItems = JSON.parse(intentionRow.parsedItems) as FlexibleIntentionItem[];
  }

  return {
    familyId,
    weekStartDate: weekStartISO,
    children: family.children.map((c) => ({ id: c.id, name: c.name })),
    routines,
    schoolEvents,
    calendarEvents,
    workBlocks,
    householdTasks,
    learningCandidates,
    intentionItems,
    freeSpaceProtectionRatio: 0.35,
  };
}

export async function generateAndPersistWeekPlan(familyId: string, weekStartISO: string) {
  const dates = weekDates(weekStartISO);
  const weekStartDate = new Date(weekStartISO + "T00:00:00");
  const weekEndDate = new Date(dates[6] + "T23:59:59");

  const input = await buildEngineInputForWeek(familyId, weekStartISO);
  const result = generateWeekPlan(input);

  // Pre-existing scheduled activities this week (completion state must survive regeneration).
  const existingScheduled = await prisma.scheduledActivity.findMany({
    where: { childId: { in: input.children.map((c) => c.id) }, date: { gte: weekStartDate, lte: weekEndDate } },
    include: { learningActivity: true },
  });

  await prisma.weekPlan.deleteMany({ where: { familyId, weekStartDate } });

  const plan = await prisma.weekPlan.create({
    data: { familyId, weekStartDate, version: 1 },
  });

  for (const existing of existingScheduled) {
    await prisma.scheduleBlock.create({
      data: {
        weekPlanId: plan.id,
        familyId,
        date: new Date(existing.date),
        startTime: existing.startTime,
        endTime: existing.endTime,
        category: "learning",
        title: existing.learningActivity.title,
        icon: existing.learningActivity.icon,
        childId: existing.childId,
        sourceType: "scheduled_activity",
        sourceId: existing.learningActivityId,
        scheduledActivityId: existing.id,
        isFreeSpace: false,
        hasConflict: false,
        isDeviation: false,
      },
    });
  }

  for (const block of result.blocks) {
    if (block.isFreeSpace) {
      await prisma.scheduleBlock.create({
        data: {
          weekPlanId: plan.id,
          familyId,
          date: new Date(block.date + "T00:00:00"),
          startTime: block.startTime,
          endTime: block.endTime,
          category: block.category,
          title: block.title,
          icon: block.icon,
          childId: block.childId,
          sourceType: block.sourceType,
          sourceId: block.sourceId,
          isFreeSpace: true,
          hasConflict: false,
          isDeviation: false,
        },
      });
      continue;
    }

    if (block.sourceType === "scheduled_activity") {
      const created = await prisma.scheduledActivity.create({
        data: {
          learningActivityId: block.sourceId!,
          childId: block.childId!,
          date: new Date(block.date + "T00:00:00"),
          startTime: block.startTime,
          endTime: block.endTime,
          status: "planned",
        },
      });
      await prisma.scheduleBlock.create({
        data: {
          weekPlanId: plan.id,
          familyId,
          date: new Date(block.date + "T00:00:00"),
          startTime: block.startTime,
          endTime: block.endTime,
          category: block.category,
          title: block.title,
          icon: block.icon,
          childId: block.childId,
          sourceType: block.sourceType,
          sourceId: block.sourceId,
          scheduledActivityId: created.id,
          isFreeSpace: false,
          hasConflict: block.hasConflict,
          isDeviation: block.isDeviation,
        },
      });
      await checkMaterialsAndAddShoppingItems(familyId, created.id, block.date, block.title, block.startTime);
      continue;
    }

    await prisma.scheduleBlock.create({
      data: {
        weekPlanId: plan.id,
        familyId,
        date: new Date(block.date + "T00:00:00"),
        startTime: block.startTime,
        endTime: block.endTime,
        category: block.category,
        title: block.title,
        icon: block.icon,
        childId: block.childId,
        sourceType: block.sourceType,
        sourceId: block.sourceId,
        householdTaskId: block.sourceType === "household_task" ? block.sourceId : undefined,
        isFreeSpace: false,
        hasConflict: block.hasConflict,
        isDeviation: block.isDeviation,
      },
    });
  }

  for (const c of result.conflicts) {
    await prisma.conflict.create({
      data: {
        weekPlanId: plan.id,
        date: new Date(c.date + "T00:00:00"),
        description: c.description,
        blockATitle: c.blockATitle,
        blockBTitle: c.blockBTitle,
        suggestion: c.suggestion ? JSON.stringify(c.suggestion) : null,
      },
    });
  }

  for (const d of result.deviations) {
    await prisma.deviation.create({
      data: {
        weekPlanId: plan.id,
        date: new Date(d.date + "T00:00:00"),
        icon: d.icon,
        title: d.title,
        description: d.description,
      },
    });
  }

  return { planId: plan.id, unscheduled: result.unscheduled };
}

const WEEKDAY_NAMES_NL = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];

async function checkMaterialsAndAddShoppingItems(
  familyId: string,
  scheduledActivityId: string,
  activityDateISO: string,
  activityTitle: string,
  startTime: string
) {
  const scheduled = await prisma.scheduledActivity.findUniqueOrThrow({
    where: { id: scheduledActivityId },
    include: { learningActivity: { include: { materials: { include: { material: true } } } } },
  });

  const dates = weekDatesContaining(activityDateISO);
  const shoppingTasks = await prisma.householdTask.findMany({
    where: { familyId, category: "shopping" },
  });
  const shoppingDaysInWeek = dates.filter((d) => {
    const weekday = isoWeekday(d);
    return shoppingTasks.some((t) => (JSON.parse(t.daysOfWeek) as number[]).includes(weekday));
  });
  const candidateShoppingDays = shoppingDaysInWeek.filter((d) => d < activityDateISO);
  const neededByISO =
    candidateShoppingDays.length > 0 ? candidateShoppingDays[candidateShoppingDays.length - 1] : activityDateISO;

  for (const link of scheduled.learningActivity.materials) {
    const inventory = await prisma.inventoryItem.findUnique({
      where: { familyId_materialId: { familyId, materialId: link.materialId } },
    });
    if (inventory?.status !== "missing") continue;

    const alreadyOnList = await prisma.shoppingItem.findFirst({
      where: { familyId, materialId: link.materialId, status: "pending" },
    });
    if (alreadyOnList) continue;

    const weekdayName = WEEKDAY_NAMES_NL[isoWeekday(activityDateISO) - 1];
    await prisma.shoppingItem.create({
      data: {
        familyId,
        materialId: link.materialId,
        name: link.material.name,
        reason: `Nodig voor "${activityTitle}" op ${weekdayName} ${startTime}`,
        sourceType: "activity",
        sourceScheduledActivityId: scheduledActivityId,
        neededByDate: new Date(neededByISO + "T00:00:00"),
        status: "pending",
      },
    });
  }
}

function weekDatesContaining(dateISO: string): string[] {
  const weekday = isoWeekday(dateISO);
  const monday = new Date(dateISO + "T00:00:00");
  monday.setDate(monday.getDate() - (weekday - 1));
  return weekDates(isoDate(monday));
}

export async function getOrCreateWeekPlan(familyId: string, weekStartISO: string) {
  let plan = await prisma.weekPlan.findFirst({
    where: { familyId, weekStartDate: new Date(weekStartISO + "T00:00:00") },
    orderBy: { generatedAt: "desc" },
  });
  if (!plan) {
    await generateAndPersistWeekPlan(familyId, weekStartISO);
    plan = await prisma.weekPlan.findFirstOrThrow({
      where: { familyId, weekStartDate: new Date(weekStartISO + "T00:00:00") },
      orderBy: { generatedAt: "desc" },
    });
  }
  return plan;
}

export async function getWeekPlanView(familyId: string, weekStartISO: string) {
  const plan = await getOrCreateWeekPlan(familyId, weekStartISO);

  const [blocks, conflicts, deviations] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { weekPlanId: plan.id },
      include: { child: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.conflict.findMany({ where: { weekPlanId: plan.id }, orderBy: { date: "asc" } }),
    prisma.deviation.findMany({ where: { weekPlanId: plan.id }, orderBy: { date: "asc" } }),
  ]);

  return { plan, blocks, conflicts, deviations };
}

export async function saveWeeklyIntention(familyId: string, weekStartISO: string, rawText: string) {
  const children = await prisma.child.findMany({ where: { familyId } });
  const service = getIntentionParsingService();
  const parsedItems = await service.parse(rawText, weekStartISO, children.map((c) => ({ id: c.id, name: c.name })));

  const weekStartDate = new Date(weekStartISO + "T00:00:00");
  const created = await prisma.weeklyIntention.create({
    data: {
      familyId,
      weekStartDate,
      rawText,
      parsedItems: JSON.stringify(parsedItems),
    },
  });

  return { intention: created, parsedItems };
}

export async function getWeeklyIntention(familyId: string, weekStartISO: string) {
  return prisma.weeklyIntention.findFirst({
    where: { familyId, weekStartDate: new Date(weekStartISO + "T00:00:00") },
    orderBy: { createdAt: "desc" },
  });
}
