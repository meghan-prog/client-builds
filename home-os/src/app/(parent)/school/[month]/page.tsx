import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { getSchoolYearForFamily } from "@/lib/data/school";
import { schoolEventTypeIcon, schoolEventTypeLabel } from "@/lib/ui/school-event-style";
import { capitalize, isoOf, mondayOfISO } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function SchoolMonthPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const familyId = await getPrimaryFamilyId();
  const schoolYear = await getSchoolYearForFamily(familyId);
  if (!schoolYear) return <div className="p-8">Geen schooljaar gevonden.</div>;

  const events = schoolYear.events.filter((e) => format(e.startDate, "yyyy-MM") === month);
  const monthLabel = capitalize(format(new Date(month + "-01T00:00:00"), "MMMM yyyy", { locale: nl }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <Link href="/school" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        ← Schooljaar {schoolYear.label}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{monthLabel}</h1>

      {events.length === 0 ? (
        <p className="text-sm text-ink-faint">Geen bijzonderheden deze maand — gewoon een normale schoolmaand.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events
            .slice()
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
            .map((e) => {
              const dateISO = isoOf(e.startDate);
              const sameDay = format(e.startDate, "yyyy-MM-dd") === format(e.endDate, "yyyy-MM-dd");
              return (
                <Link
                  key={e.id}
                  href={`/week/${mondayOfISO(dateISO)}/${dateISO}`}
                  className="card flex items-center gap-3 p-4 hover:shadow-md"
                >
                  <span className="text-2xl">{schoolEventTypeIcon(e.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{e.title}</p>
                    <p className="text-xs text-ink-faint">
                      {sameDay
                        ? format(e.startDate, "EEEE d MMMM", { locale: nl })
                        : `${format(e.startDate, "d MMM", { locale: nl })} — ${format(e.endDate, "d MMM", { locale: nl })}`}
                      {" · "}
                      {schoolEventTypeLabel(e.type)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-faint">Bekijk week →</span>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}
