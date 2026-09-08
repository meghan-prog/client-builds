import Link from "next/link";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getChildrenForFamily, ageFromBirthDate } from "@/lib/data/children";

export default async function KidsPickerPage() {
  const familyId = await getPrimaryFamilyId();
  const children = await getChildrenForFamily(familyId);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-10">
      <p className="mb-2 text-sm font-medium text-ink-faint">Kindmodus</p>
      <h1 className="mb-10 text-3xl font-semibold tracking-tight text-ink">Wie ben jij?</h1>
      <div className="flex flex-wrap justify-center gap-6">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/kids/${child.id}`}
            className="flex w-44 flex-col items-center gap-3 rounded-3xl border border-border bg-surface p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
          >
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
              style={{ backgroundColor: child.colorHex + "33" }}
            >
              {child.avatarEmoji}
            </div>
            <p className="text-lg font-semibold text-ink">{child.name}</p>
            <p className="text-xs text-ink-faint">{ageFromBirthDate(child.birthDate)} jaar</p>
          </Link>
        ))}
      </div>
      <Link href="/week" className="mt-12 text-sm text-ink-faint underline hover:text-ink-soft">
        Terug naar oudermodus
      </Link>
    </div>
  );
}
