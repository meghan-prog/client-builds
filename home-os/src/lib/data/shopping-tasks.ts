import { prisma } from "@/lib/db";
import { isoWeekday } from "@/lib/planning-engine/time";

export async function getShoppingList(familyId: string) {
  return prisma.shoppingItem.findMany({
    where: { familyId },
    include: { material: true },
    orderBy: [{ status: "asc" }, { neededByDate: "asc" }],
  });
}

export async function addManualShoppingItem(familyId: string, name: string) {
  return prisma.shoppingItem.create({
    data: { familyId, name, reason: "Handmatig toegevoegd", sourceType: "manual", status: "pending" },
  });
}

export async function toggleShoppingItem(id: string) {
  const item = await prisma.shoppingItem.findUniqueOrThrow({ where: { id } });
  const nextStatus = item.status === "pending" ? "bought" : "pending";
  const updated = await prisma.shoppingItem.update({ where: { id }, data: { status: nextStatus } });

  if (nextStatus === "bought" && item.materialId) {
    await prisma.inventoryItem.upsert({
      where: { familyId_materialId: { familyId: item.familyId, materialId: item.materialId } },
      update: { status: "present" },
      create: { familyId: item.familyId, materialId: item.materialId, status: "present" },
    });
  }
  return updated;
}

export async function getHouseholdTasksForDate(familyId: string, dateISO: string) {
  const weekday = isoWeekday(dateISO);
  const date = new Date(dateISO + "T00:00:00");
  const tasks = await prisma.householdTask.findMany({
    where: { familyId },
    include: { completions: { where: { date } } },
  });
  return tasks
    .filter((t) => (JSON.parse(t.daysOfWeek) as number[]).includes(weekday))
    .map((t) => ({ ...t, isDoneToday: t.completions.length > 0 }));
}

export async function getAllHouseholdTasks(familyId: string) {
  return prisma.householdTask.findMany({ where: { familyId }, orderBy: { title: "asc" } });
}

export async function toggleHouseholdTaskCompletion(taskId: string, dateISO: string, childId?: string | null) {
  const date = new Date(dateISO + "T00:00:00");
  const existing = await prisma.householdTaskCompletion.findUnique({
    where: { taskId_date: { taskId, date } },
  });
  if (existing) {
    await prisma.householdTaskCompletion.delete({ where: { id: existing.id } });
    return { done: false };
  }
  await prisma.householdTaskCompletion.create({ data: { taskId, date, childId: childId ?? null } });
  return { done: true };
}
