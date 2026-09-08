import { prisma } from "@/lib/db";

export async function getChildrenForFamily(familyId: string) {
  return prisma.child.findMany({
    where: { familyId },
    include: { learningGoals: true },
    orderBy: { birthDate: "desc" },
  });
}

export async function getChildDetail(childId: string) {
  const child = await prisma.child.findUniqueOrThrow({
    where: { id: childId },
    include: {
      learningGoals: true,
      routineLinks: { include: { routine: true } },
    },
  });
  const householdTasks = await prisma.householdTask.findMany({ where: { assignedChildId: childId } });
  return { child, householdTasks };
}

function ageFromBirthDate(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

export { ageFromBirthDate };
