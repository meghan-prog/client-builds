import { prisma } from "@/lib/db";

export async function getWorkProfilesForFamily(familyId: string) {
  const parents = await prisma.parent.findMany({
    where: { familyId },
    include: { workProfiles: { include: { blocks: true }, orderBy: { createdAt: "asc" } } },
  });
  return parents;
}

export async function createWorkProfile(parentId: string, name: string) {
  return prisma.workProfile.create({ data: { parentId, name, isDefault: false } });
}

export async function setDefaultWorkProfile(parentId: string, workProfileId: string) {
  await prisma.workProfile.updateMany({ where: { parentId }, data: { isDefault: false } });
  await prisma.workProfile.update({ where: { id: workProfileId }, data: { isDefault: true } });
}
