import Link from "next/link";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getChildrenForFamily, ageFromBirthDate } from "@/lib/data/children";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const familyId = await getPrimaryFamilyId();
  const children = await getChildrenForFamily(familyId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-sm font-medium text-ink-faint">Gezin</p>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl">Kinderen</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children.map((child) => (
          <Link key={child.id} href={`/children/${child.id}`} className="card flex items-center gap-4 p-5 hover:shadow-md">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl"
              style={{ backgroundColor: child.colorHex + "33" }}
            >
              {child.avatarEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-ink">{child.name}</p>
              <p className="text-sm text-ink-faint">{ageFromBirthDate(child.birthDate)} jaar</p>
              {child.learningGoals.length > 0 && (
                <p className="mt-1 truncate text-xs text-ink-soft">🎯 {child.learningGoals[0].title}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
