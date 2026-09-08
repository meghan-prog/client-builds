import { prisma } from "@/lib/db";

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
