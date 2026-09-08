import { addDays, format, startOfWeek } from "date-fns";
import { prisma } from "@/lib/db";
import { generateAndPersistWeekPlan } from "@/lib/data/planning";
import type { SuggestedActivity } from "@/lib/ai/activity-suggester";

export async function getScheduledActivityDetail(scheduledActivityId: string) {
  const sa = await prisma.scheduledActivity.findUniqueOrThrow({
    where: { id: scheduledActivityId },
    include: {
      child: true,
      learningActivity: {
        include: {
          materials: { include: { material: true } },
          skill: { include: { goal: true } },
        },
      },
    },
  });

  const materials = await Promise.all(
    sa.learningActivity.materials.map(async (link) => {
      const inv = await prisma.inventoryItem.findUnique({
        where: { familyId_materialId: { familyId: sa.child.familyId, materialId: link.materialId } },
      });
      return { id: link.material.id, name: link.material.name, status: inv?.status ?? "unknown" };
    })
  );

  return {
    scheduledActivity: sa,
    instructions: JSON.parse(sa.learningActivity.instructions) as string[],
    materials,
  };
}

async function recomputeProgress(skillId: string, goalId: string) {
  const skill = await prisma.learningSkill.findUniqueOrThrow({
    where: { id: skillId },
    include: { activities: { include: { scheduledInstances: true } } },
  });
  let total = 0;
  let done = 0;
  for (const act of skill.activities) {
    total += 1;
    if (act.scheduledInstances.some((si) => si.status === "done")) done += 1;
  }
  await prisma.learningSkill.update({ where: { id: skillId }, data: { progress: total ? done / total : 0 } });

  const goalSkills = await prisma.learningSkill.findMany({
    where: { goalId },
    include: { activities: { include: { scheduledInstances: true } } },
  });
  let gTotal = 0;
  let gDone = 0;
  for (const s of goalSkills) {
    for (const act of s.activities) {
      gTotal += 1;
      if (act.scheduledInstances.some((si) => si.status === "done")) gDone += 1;
    }
  }
  await prisma.learningGoal.update({ where: { id: goalId }, data: { progress: gTotal ? gDone / gTotal : 0 } });
}

export async function setScheduledActivityStatus(scheduledActivityId: string, done: boolean) {
  const sa = await prisma.scheduledActivity.update({
    where: { id: scheduledActivityId },
    data: { status: done ? "done" : "planned", completedAt: done ? new Date() : null },
    include: { learningActivity: { include: { skill: { include: { goal: true } } } } },
  });
  await recomputeProgress(sa.learningActivity.skill.id, sa.learningActivity.skill.goal.id);
  return sa;
}

export async function getLearningGoalsForFamily(familyId: string) {
  return prisma.learningGoal.findMany({
    where: { child: { familyId } },
    include: { child: true },
    orderBy: { startDate: "asc" },
  });
}

export async function getLearningGoalDetail(goalId: string) {
  const goal = await prisma.learningGoal.findUniqueOrThrow({
    where: { id: goalId },
    include: { child: true },
  });
  const skills = await prisma.learningSkill.findMany({
    where: { goalId },
    include: { activities: { include: { scheduledInstances: true } } },
    orderBy: { periodStart: "asc" },
  });
  const yearSkills = skills.filter((s) => s.period === "year");
  const monthSkills = skills.filter((s) => s.period === "month");
  const weekSkills = skills.filter((s) => s.period === "week");
  return { goal, yearSkills, monthSkills, weekSkills };
}

export async function getChildScheduledActivities(childId: string) {
  return prisma.scheduledActivity.findMany({
    where: { childId },
    include: { learningActivity: true },
    orderBy: { date: "desc" },
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function findOrCreateMaterial(name: string) {
  const existing = await prisma.material.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.material.create({ data: { name, category: "overig" } });
}

/**
 * Turns an assistant-proposed focus topic + activity ideas into real
 * LearningGoal/LearningSkill/LearningActivity rows for this week, reusing an
 * existing goal for the same topic (fuzzy title match) instead of creating a
 * duplicate every time the topic comes up again, then regenerates the
 * family's current-week plan so the new activities actually get scheduled.
 */
export async function createLearningFocus(
  familyId: string,
  topic: string,
  childIds: string[],
  activities: SuggestedActivity[]
) {
  const weekStartISO = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekStart = new Date(weekStartISO + "T00:00:00");
  const weekEnd = addDays(weekStart, 6);
  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
  const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);

  const schoolYear = await prisma.schoolYear.findFirst({ where: { familyId }, orderBy: { startDate: "desc" } });
  const goalStart = schoolYear?.startDate ?? weekStart;
  const goalEnd = schoolYear?.endDate ?? addDays(weekStart, 365);

  const normalizedTopic = topic.trim().toLowerCase();
  const createdActivityIds: string[] = [];

  for (const childId of childIds) {
    const existingGoals = await prisma.learningGoal.findMany({ where: { childId } });
    let goal = existingGoals.find(
      (g) => g.title.toLowerCase().includes(normalizedTopic) || normalizedTopic.includes(g.title.toLowerCase())
    );

    if (!goal) {
      goal = await prisma.learningGoal.create({
        data: {
          childId,
          title: `Focus: ${capitalize(topic)}`,
          description: `Op verzoek via de assistent: extra aandacht voor "${topic}".`,
          startDate: goalStart,
          endDate: goalEnd,
          progress: 0,
        },
      });
      await prisma.learningSkill.create({
        data: { goalId: goal.id, period: "year", title: capitalize(topic), periodStart: goalStart, periodEnd: goalEnd },
      });
    }

    const yearSkill = await prisma.learningSkill.findFirstOrThrow({ where: { goalId: goal.id, period: "year" } });

    let monthSkill = await prisma.learningSkill.findFirst({
      where: { goalId: goal.id, period: "month", periodStart: monthStart },
    });
    if (!monthSkill) {
      monthSkill = await prisma.learningSkill.create({
        data: {
          goalId: goal.id,
          parentSkillId: yearSkill.id,
          period: "month",
          title: capitalize(topic),
          periodStart: monthStart,
          periodEnd: monthEnd,
        },
      });
    }

    let weekSkill = await prisma.learningSkill.findFirst({
      where: { goalId: goal.id, period: "week", periodStart: weekStart },
    });
    if (!weekSkill) {
      weekSkill = await prisma.learningSkill.create({
        data: {
          goalId: goal.id,
          parentSkillId: monthSkill.id,
          period: "week",
          title: `${capitalize(topic)} — deze week`,
          periodStart: weekStart,
          periodEnd: weekEnd,
        },
      });
    }

    for (const a of activities) {
      const activity = await prisma.learningActivity.create({
        data: {
          skillId: weekSkill.id,
          title: a.title,
          icon: a.icon,
          ageRangeMin: 2,
          ageRangeMax: 12,
          durationMinutes: a.durationMinutes,
          instructions: JSON.stringify(a.instructions),
          prepMinutes: a.prepMinutes,
          location: "Thuis",
          difficulty: a.difficulty,
        },
      });
      for (const materialName of a.materials) {
        const material = await findOrCreateMaterial(materialName);
        await prisma.inventoryItem.upsert({
          where: { familyId_materialId: { familyId, materialId: material.id } },
          update: {},
          create: { familyId, materialId: material.id, status: "unknown" },
        });
        await prisma.learningActivityMaterial.create({
          data: { activityId: activity.id, materialId: material.id },
        });
      }
      createdActivityIds.push(activity.id);
    }
  }

  await generateAndPersistWeekPlan(familyId, weekStartISO);

  return { weekStart: weekStartISO, createdActivityIds };
}
