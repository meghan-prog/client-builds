import { addDays, format, startOfWeek } from "date-fns";
import ical from "node-ical";
import { prisma } from "@/lib/db";
import { generateAndPersistWeekPlan } from "@/lib/data/planning";

// How far back/forward a sync looks. Wide enough to catch "we're behind on
// last week's appointments" and "what's coming up this term", without
// importing someone's entire calendar history on every refresh.
const SYNC_WINDOW_PAST_DAYS = 14;
const SYNC_WINDOW_FUTURE_DAYS = 180;

// ICS properties can carry parameters (e.g. `SUMMARY;LANGUAGE=nl:Tandarts`),
// in which case node-ical returns `{ val, params }` instead of a plain
// string — normalize either shape down to text.
function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "val" in value) return String((value as { val: unknown }).val);
  return fallback;
}

function guessEventType(summary: string): "birthday" | "appointment" {
  const lower = summary.toLowerCase();
  if (lower.includes("verjaardag") || lower.includes("birthday") || lower.includes("jarig")) return "birthday";
  return "appointment";
}

export async function getOrCreateFamilyCalendar(familyId: string) {
  const existing = await prisma.calendar.findFirst({ where: { familyId, type: "family" } });
  if (existing) return existing;
  return prisma.calendar.create({ data: { familyId, type: "family", name: "Gezinskalender" } });
}

export async function connectCalendarFeed(familyId: string, icsFeedUrl: string) {
  const calendar = await getOrCreateFamilyCalendar(familyId);
  await prisma.calendar.update({ where: { id: calendar.id }, data: { icsFeedUrl: icsFeedUrl.trim() } });
  return syncCalendarFeed(familyId);
}

export async function disconnectCalendarFeed(familyId: string) {
  const calendar = await getOrCreateFamilyCalendar(familyId);
  await prisma.calendar.update({ where: { id: calendar.id }, data: { icsFeedUrl: null, lastSyncedAt: null } });
}

/** Adds a one-off appointment (e.g. via the assistant) and replans the affected week. */
export async function addManualCalendarEvent(
  familyId: string,
  input: { title: string; dateISO: string; startTime?: string | null; endTime?: string | null; type?: string; notes?: string }
) {
  const calendar = await getOrCreateFamilyCalendar(familyId);
  await prisma.calendarEvent.create({
    data: {
      calendarId: calendar.id,
      title: input.title,
      type: input.type ?? "appointment",
      date: new Date(input.dateISO + "T00:00:00"),
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      notes: input.notes ?? null,
      source: "manual",
    },
  });
  const weekStart = format(startOfWeek(new Date(input.dateISO + "T00:00:00"), { weekStartsOn: 1 }), "yyyy-MM-dd");
  await generateAndPersistWeekPlan(familyId, weekStart);
  return { weekStart };
}

/**
 * Fetches the family's subscribed iCal feed (Google/Apple/Outlook "secret
 * address in iCal format") and mirrors it into CalendarEvent rows for the
 * sync window, expanding recurring events via node-ical's RRULE support.
 * A full refresh: previously-synced rows in the window are replaced, so
 * deletions/edits on the source calendar are picked up too. Rows added
 * manually or by the assistant (source: "manual") are never touched.
 */
export async function syncCalendarFeed(familyId: string) {
  const calendar = await getOrCreateFamilyCalendar(familyId);
  if (!calendar.icsFeedUrl) {
    throw new Error("Geen agenda gekoppeld — voeg eerst een iCal-adres toe.");
  }

  const from = addDays(new Date(), -SYNC_WINDOW_PAST_DAYS);
  const to = addDays(new Date(), SYNC_WINDOW_FUTURE_DAYS);

  const parsed = await ical.async.fromURL(calendar.icsFeedUrl);
  const rows: {
    externalUid: string;
    title: string;
    type: string;
    date: Date;
    startTime: string | null;
    endTime: string | null;
  }[] = [];

  for (const item of Object.values(parsed)) {
    if (!item || item.type !== "VEVENT") continue;
    const summary = toText(item.summary, "(geen titel)");
    const type = guessEventType(summary);

    if (item.rrule) {
      const instances = ical.expandRecurringEvent(item, { from, to });
      for (const instance of instances) {
        rows.push({
          externalUid: `${item.uid}::${format(instance.start, "yyyy-MM-dd")}`,
          title: summary,
          type,
          date: instance.start,
          startTime: instance.isFullDay ? null : format(instance.start, "HH:mm"),
          endTime: instance.isFullDay || !instance.end ? null : format(instance.end, "HH:mm"),
        });
      }
      continue;
    }

    if (!item.start || item.start < from || item.start > to) continue;
    rows.push({
      externalUid: item.uid ?? `${summary}-${item.start.toISOString()}`,
      title: summary,
      type,
      date: item.start,
      startTime: item.datetype === "date" ? null : format(item.start, "HH:mm"),
      endTime: item.datetype === "date" || !item.end ? null : format(item.end, "HH:mm"),
    });
  }

  await prisma.$transaction([
    prisma.calendarEvent.deleteMany({
      where: { calendarId: calendar.id, source: "ics_sync", date: { gte: from, lte: to } },
    }),
    ...rows.map((r) =>
      prisma.calendarEvent.create({
        data: {
          calendarId: calendar.id,
          title: r.title,
          type: r.type,
          date: r.date,
          startTime: r.startTime,
          endTime: r.endTime,
          source: "ics_sync",
          externalUid: r.externalUid,
        },
      })
    ),
  ]);

  await prisma.calendar.update({ where: { id: calendar.id }, data: { lastSyncedAt: new Date() } });

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  await generateAndPersistWeekPlan(familyId, weekStart);

  return { importedCount: rows.length, weekStart };
}
