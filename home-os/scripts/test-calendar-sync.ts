import { createServer } from "node:http";
import { prisma } from "../src/lib/db";
import { getPrimaryFamilyId } from "../src/lib/data/family";
import { connectCalendarFeed, syncCalendarFeed } from "../src/lib/data/calendar-sync";
import { format, addDays } from "date-fns";

const today = new Date();
const dtstamp = (d: Date) => format(d, "yyyyMMdd'T'HHmmss'Z'");
const dtdate = (d: Date) => format(d, "yyyyMMdd");

const soonAppointment = addDays(today, 2);
const soonBirthday = addDays(today, 5);
const rruleAnchor = addDays(today, -10); // weekly event that started in the past, should still expand into the future

const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:test-appointment-1@example.com
DTSTAMP:${dtstamp(today)}
DTSTART:${dtstamp(soonAppointment)}
DTEND:${dtstamp(addDays(soonAppointment, 0))}
SUMMARY:Tandarts Loïs
END:VEVENT
BEGIN:VEVENT
UID:test-birthday-1@example.com
DTSTAMP:${dtstamp(today)}
DTSTART;VALUE=DATE:${dtdate(soonBirthday)}
SUMMARY:Verjaardag opa
END:VEVENT
BEGIN:VEVENT
UID:test-swim-weekly@example.com
DTSTAMP:${dtstamp(today)}
DTSTART:${dtstamp(rruleAnchor)}
DTEND:${dtstamp(rruleAnchor)}
RRULE:FREQ=WEEKLY;COUNT=20
SUMMARY:Zwemles
END:VEVENT
END:VCALENDAR`;

async function main() {
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/calendar" });
    res.end(ics);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  const url = `http://127.0.0.1:${address.port}/calendar.ics`;
  console.log("Serving test ICS at", url);

  const familyId = await getPrimaryFamilyId();
  const { importedCount } = await connectCalendarFeed(familyId, url);
  console.log("Imported (first sync):", importedCount);

  const calendar = await prisma.calendar.findFirstOrThrow({ where: { familyId, type: "family" } });
  console.log("icsFeedUrl saved:", calendar.icsFeedUrl);
  console.log("lastSyncedAt:", calendar.lastSyncedAt);

  const events = await prisma.calendarEvent.findMany({ where: { calendarId: calendar.id }, orderBy: { date: "asc" } });
  console.log(`\nCalendarEvent rows: ${events.length}`);
  for (const e of events.slice(0, 10)) {
    console.log(` - ${format(e.date, "yyyy-MM-dd")} ${e.startTime ?? "(hele dag)"} [${e.type}] ${e.title} (source=${e.source})`);
  }
  if (events.length > 10) console.log(`   ...en nog ${events.length - 10} meer (waarschijnlijk de wekelijkse zwemles-reeks)`);

  // Re-sync: should replace, not duplicate.
  const second = await syncCalendarFeed(familyId);
  console.log("\nImported (second sync, should match first):", second.importedCount);
  const eventsAfter = await prisma.calendarEvent.findMany({ where: { calendarId: calendar.id } });
  console.log("Total rows after second sync (should be unchanged, not doubled):", eventsAfter.length);

  server.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
