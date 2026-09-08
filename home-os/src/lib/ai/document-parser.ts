// AI document extraction — abstraction layer.
//
// The MVP ships a mock implementation so the upload flow works end-to-end
// today. Swap `getDocumentParsingService()` for a real implementation (e.g.
// one backed by the Claude API's document/vision understanding) later — no
// caller needs to change, since everyone only depends on the
// `DocumentParsingService` interface below.

export type ExtractedSchoolEventType =
  | "school_day"
  | "study_day"
  | "holiday"
  | "school_trip"
  | "parent_evening"
  | "free_day"
  | "school_activity";

export interface ExtractedSchoolEvent {
  type: ExtractedSchoolEventType;
  title: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  rawText?: string;
}

export interface DocumentParseInput {
  fileName: string;
  fileType: "pdf" | "csv" | "xlsx" | "image" | "unknown";
  schoolYearStart: string; // ISO date, used by the mock to anchor plausible dates
  schoolYearEnd: string;
}

export interface DocumentParseResult {
  events: ExtractedSchoolEvent[];
  confidence: number; // 0..1
  notes: string;
}

export interface DocumentParsingService {
  extractSchoolEvents(input: DocumentParseInput): Promise<DocumentParseResult>;
}

/**
 * Deterministic mock: simulates the latency and shape of a real document
 * extraction call, and produces a realistic spread of school-year events
 * anchored to the given school year so the rest of the app (school year
 * view, planning engine) has real data to work with.
 */
export class MockDocumentParsingService implements DocumentParsingService {
  async extractSchoolEvents(input: DocumentParseInput): Promise<DocumentParseResult> {
    await new Promise((resolve) => setTimeout(resolve, 900));

    const start = new Date(input.schoolYearStart + "T00:00:00");
    const addDays = (base: Date, days: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    const events: ExtractedSchoolEvent[] = [
      {
        type: "study_day",
        title: "Studiedag",
        startDate: addDays(start, 15),
        endDate: addDays(start, 15),
        rawText: `Geëxtraheerd uit ${input.fileName}`,
      },
      {
        type: "school_trip",
        title: "Schoolreis",
        startDate: addDays(start, 31),
        endDate: addDays(start, 31),
        rawText: `Geëxtraheerd uit ${input.fileName}`,
      },
      {
        type: "holiday",
        title: "Herfstvakantie",
        startDate: addDays(start, 41),
        endDate: addDays(start, 45),
        rawText: `Geëxtraheerd uit ${input.fileName}`,
      },
      {
        type: "parent_evening",
        title: "Ouderavond",
        startDate: addDays(start, 20),
        endDate: addDays(start, 20),
        rawText: `Geëxtraheerd uit ${input.fileName}`,
      },
      {
        type: "holiday",
        title: "Kerstvakantie",
        startDate: addDays(start, 105),
        endDate: addDays(start, 119),
        rawText: `Geëxtraheerd uit ${input.fileName}`,
      },
      {
        type: "study_day",
        title: "Studiedag",
        startDate: addDays(start, 130),
        endDate: addDays(start, 130),
        rawText: `Geëxtraheerd uit ${input.fileName}`,
      },
      {
        type: "holiday",
        title: "Voorjaarsvakantie",
        startDate: addDays(start, 160),
        endDate: addDays(start, 164),
        rawText: `Geëxtraheerd uit ${input.fileName}`,
      },
      {
        type: "school_activity",
        title: "Sportdag",
        startDate: addDays(start, 180),
        endDate: addDays(start, 180),
        rawText: `Geëxtraheerd uit ${input.fileName}`,
      },
    ];

    return {
      events,
      confidence: 0.86,
      notes:
        "Gesimuleerde extractie (mock AI service). Vervang DocumentParsingService door een echte implementatie voor productie.",
    };
  }
}

export function getDocumentParsingService(): DocumentParsingService {
  return new MockDocumentParsingService();
}
