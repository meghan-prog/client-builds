// Sunday-intentions parsing — abstraction layer.
//
// The MVP ships a small keyword/weekday-based Dutch parser so free text
// really turns into schedule items end-to-end. Swap `getIntentionParsingService()`
// for an LLM-backed implementation later (e.g. Claude extracting structured
// items from the same free text) without touching any caller — everyone only
// depends on the `IntentionParsingService` interface.

import { addDaysISO } from "@/lib/planning-engine/time";

export type ParsedIntentionKind = "flexible_activity" | "hard_appointment" | "household" | "learning_focus";

export interface ParsedIntentionItem {
  id: string;
  title: string;
  icon: string;
  date: string; // ISO date
  childId?: string | null;
  kind: ParsedIntentionKind;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  sourceSentence: string;
}

export interface IntentionParsingService {
  parse(rawText: string, weekStartISO: string, children: { id: string; name: string }[]): Promise<ParsedIntentionItem[]>;
}

const WEEKDAY_WORDS: Record<string, number> = {
  maandag: 1,
  dinsdag: 2,
  woensdag: 3,
  donderdag: 4,
  vrijdag: 5,
  zaterdag: 6,
  zondag: 7,
};

interface KeywordRule {
  words: string[];
  title: string;
  icon: string;
  kind: ParsedIntentionKind;
  durationMinutes?: number;
}

const KEYWORD_RULES: KeywordRule[] = [
  { words: ["tandarts"], title: "Tandarts", icon: "🦷", kind: "hard_appointment", durationMinutes: 45 },
  { words: ["dokter", "huisarts"], title: "Dokter", icon: "🩺", kind: "hard_appointment", durationMinutes: 30 },
  { words: ["boodschappen"], title: "Boodschappen", icon: "🛒", kind: "household", durationMinutes: 45 },
  { words: ["strand"], title: "Strandmiddag", icon: "🏖️", kind: "flexible_activity", durationMinutes: 60 },
  { words: ["zwemles", "zwemmen"], title: "Zwemles", icon: "🏊", kind: "hard_appointment", durationMinutes: 45 },
  { words: ["werken", "werk"], title: "Werken", icon: "💻", kind: "hard_appointment", durationMinutes: 360 },
  { words: ["verjaardag"], title: "Verjaardag", icon: "🎂", kind: "flexible_activity", durationMinutes: 60 },
  { words: ["oudergesprek", "ouderavond"], title: "Oudergesprek", icon: "🗣️", kind: "hard_appointment", durationMinutes: 30 },
  { words: ["bezoek"], title: "Bezoek", icon: "🏡", kind: "flexible_activity", durationMinutes: 60 },
  { words: ["sport", "training"], title: "Sport", icon: "⚽", kind: "hard_appointment", durationMinutes: 60 },
];

const LEARNING_FOCUS_WORDS = ["oefenen", "extra leren", "leerdoel"];

let counter = 0;
function nextId() {
  counter += 1;
  return `intention-${Date.now()}-${counter}`;
}

export class NaiveDutchIntentionParsingService implements IntentionParsingService {
  async parse(
    rawText: string,
    weekStartISO: string,
    children: { id: string; name: string }[]
  ): Promise<ParsedIntentionItem[]> {
    const items: ParsedIntentionItem[] = [];
    const sentences = rawText
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();

      const matchedWeekdays = Object.entries(WEEKDAY_WORDS)
        .filter(([word]) => lower.includes(word))
        .map(([, idx]) => idx);
      if (matchedWeekdays.length === 0) continue;

      const matchedChild = children.find((c) => lower.includes(c.name.toLowerCase()));

      const isLearningFocus = LEARNING_FOCUS_WORDS.some((w) => lower.includes(w));
      if (isLearningFocus) {
        for (const weekday of matchedWeekdays) {
          items.push({
            id: nextId(),
            title: "Extra leren: " + sentence.replace(/^.*?(oefenen|extra leren|leerdoel)/i, "$1").trim(),
            icon: "🎓",
            date: addDaysISO(weekStartISO, weekday - 1),
            childId: matchedChild?.id ?? null,
            kind: "learning_focus",
            sourceSentence: sentence,
          });
        }
        continue;
      }

      const rule = KEYWORD_RULES.find((r) => r.words.some((w) => lower.includes(w)));
      if (!rule) continue;

      for (const weekday of matchedWeekdays) {
        items.push({
          id: nextId(),
          title: rule.title,
          icon: rule.icon,
          date: addDaysISO(weekStartISO, weekday - 1),
          childId: matchedChild?.id ?? null,
          kind: rule.kind,
          durationMinutes: rule.durationMinutes,
          sourceSentence: sentence,
        });
      }
    }

    return items;
  }
}

export function getIntentionParsingService(): IntentionParsingService {
  return new NaiveDutchIntentionParsingService();
}
