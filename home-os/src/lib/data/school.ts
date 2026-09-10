import { startOfWeek, format } from "date-fns";
import { prisma } from "@/lib/db";
import { getDocumentParsingService, type DocumentParseInput } from "@/lib/ai/document-parser";
import { generateAndPersistWeekPlan } from "@/lib/data/planning";

export async function getSchoolYearForFamily(familyId: string) {
  return prisma.schoolYear.findFirst({
    where: { familyId },
    include: { events: { orderBy: { startDate: "asc" } } },
    orderBy: { startDate: "desc" },
  });
}

export async function uploadAndParseSchoolCalendar(
  familyId: string,
  schoolYearId: string,
  fileName: string,
  fileType: DocumentParseInput["fileType"]
) {
  const schoolYear = await prisma.schoolYear.findUniqueOrThrow({ where: { id: schoolYearId } });
  const upload = await prisma.schoolCalendarUpload.create({
    data: { fileName, fileType, status: "processing" },
  });

  try {
    const service = getDocumentParsingService();
    const result = await service.extractSchoolEvents({
      fileName,
      fileType,
      schoolYearStart: schoolYear.startDate.toISOString().slice(0, 10),
      schoolYearEnd: schoolYear.endDate.toISOString().slice(0, 10),
    });

    for (const e of result.events) {
      await prisma.schoolEvent.create({
        data: {
          schoolYearId,
          childId: null,
          type: e.type,
          title: e.title,
          startDate: new Date(e.startDate + "T00:00:00"),
          endDate: new Date(e.endDate + "T00:00:00"),
          source: "school_calendar_upload",
          rawText: e.rawText,
        },
      });
    }

    await prisma.schoolCalendarUpload.update({
      where: { id: upload.id },
      data: { status: "parsed", extractedCount: result.events.length },
    });

    return { upload, events: result.events, notes: result.notes, confidence: result.confidence };
  } catch (err) {
    await prisma.schoolCalendarUpload.update({ where: { id: upload.id }, data: { status: "failed" } });
    throw err;
  }
}

export async function getSchoolCalendarUploads() {
  return prisma.schoolCalendarUpload.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
}

/**
 * Ad-hoc, same-day/next-day "school is cancelled" report — distinct from the
 * school's own planned calendar (studiedag, vakantie, ...). Creates a
 * suppressing SchoolEvent for the date and immediately regenerates that
 * week's plan, so the freed-up time is re-evaluated straight away: the
 * school block disappears and anything still queued for the child's
 * learning goal gets a chance to fill the newly open afternoon, exactly
 * like any other regeneration.
 */
export async function reportSchoolCancellation(
  familyId: string,
  dateISO: string,
  childId: string | null,
  reason?: string
) {
  const schoolYear = await prisma.schoolYear.findFirstOrThrow({ where: { familyId }, orderBy: { startDate: "desc" } });
  const date = new Date(dateISO + "T00:00:00");

  const event = await prisma.schoolEvent.create({
    data: {
      schoolYearId: schoolYear.id,
      childId,
      type: "school_cancelled",
      title: "School afgelast",
      startDate: date,
      endDate: date,
      source: "manual",
      rawText: reason,
    },
  });

  const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
  await generateAndPersistWeekPlan(familyId, weekStart);

  return { event, weekStart };
}
