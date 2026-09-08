import { prisma } from "@/lib/db";

/**
 * MVP scope: one demo family, no multi-tenant auth yet. This is the single
 * seam to widen later (swap for a session-derived familyId) without
 * touching every call site.
 */
export async function getPrimaryFamily() {
  const family = await prisma.family.findFirst({
    orderBy: { createdAt: "asc" },
    include: { children: true, parents: true },
  });
  if (!family) {
    throw new Error("Geen gezin gevonden. Draai `npx prisma db seed` om demodata te laden.");
  }
  return family;
}

export async function getPrimaryFamilyId(): Promise<string> {
  const family = await getPrimaryFamily();
  return family.id;
}
