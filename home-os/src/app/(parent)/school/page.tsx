import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getSchoolYearForFamily } from "@/lib/data/school";
import { schoolEventTypeIcon } from "@/lib/ui/school-event-style";
import { capitalize } from "@/lib/ui/format";
import SchoolCalendarUpload from "@/components/SchoolCalendarUpload";

export const dynamic = "force-dynamic";

export default async function SchoolYearPage() {
  const familyId = await getPrimaryFamilyId();
  const schoolYear = await getSchoolYearForFamily(familyId);

  if (!schoolYear) {
    return <div className="p-8">Geen schooljaar gevonden.</div>;
  }

  const monthsMap = new Map<string, { label: string; events: typeof schoolYear.events }>();
  let cursor = new Date(schoolYear.startDate);
  const end = new Date(schoolYear.endDate);
  while (cursor <= end) {
    const key = format(cursor, "yyyy-MM");
    if (!monthsMap.has(key)) {
      monthsMap.set(key, { label: capitalize(format(cursor, "MMMM yyyy", { locale: nl })), events: [] });
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  for (const e of schoolYear.events) {
    const key = format(e.startDate, "yyyy-MM");
    if (!monthsMap.has(key)) monthsMap.set(key, { label: capitalize(format(e.startDate, "MMMM yyyy", { locale: nl })), events: [] });
    monthsMap.get(key)!.events.push(e);
  }

  const months = Array.from(monthsMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-sm font-medium text-ink-faint">Schooljaar</p>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{schoolYear.label}</h1>

      <div className="mb-8">
        <SchoolCalendarUpload schoolYearId={schoolYear.id} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {months.map(([key, month]) => (
          <Link key={key} href={`/school/${key}`} className="card flex flex-col p-4 hover:shadow-md">
            <h2 className="mb-2 text-sm font-semibold text-ink">{month.label}</h2>
            {month.events.length === 0 ? (
              <p className="text-xs text-ink-faint">Geen bijzonderheden</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {month.events.slice(0, 3).map((e) => (
                  <li key={e.id} className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <span>{schoolEventTypeIcon(e.type)}</span>
                    <span>{format(e.startDate, "d MMM", { locale: nl })}</span>
                    <span className="truncate">{e.title}</span>
                  </li>
                ))}
                {month.events.length > 3 && (
                  <li className="text-xs text-ink-faint">+{month.events.length - 3} meer</li>
                )}
              </ul>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
