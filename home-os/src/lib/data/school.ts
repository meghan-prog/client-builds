import { prisma } from "@/lib/db";
import { getDocumentParsingService, type DocumentParseInput } from "@/lib/ai/document-parser";

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
