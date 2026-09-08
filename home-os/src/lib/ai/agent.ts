// Home OS assistant — abstraction layer.
//
// The MVP ships a rule-based mock so the full conversational loop (report,
// clarify, propose, apply) works end-to-end today: report a school
// cancellation, set a learning focus for the week, ask for activity ideas.
// Swap `getHomeAgentService()` for a real implementation later — e.g. the
// Claude Messages API with tool use, where each `AgentActionType` below
// becomes a tool definition and the model's tool call becomes the
// `actionPayload` — and nothing else in the app needs to change: the chat
// UI and the action-execution code (src/lib/data/agent.ts) only ever look
// at the `AgentReply` shape, never at how it was produced.

import { addDays, format } from "date-fns";
import { getActivitySuggesterService, type SuggestedActivity } from "./activity-suggester";

export type AgentActionType = "clarify_child" | "cancel_school" | "create_learning_focus";

export interface AgentContextChild {
  id: string;
  name: string;
  ageYears: number;
}

export interface AgentHistoryMessage {
  role: "user" | "assistant";
  content: string;
  actionType?: string | null;
  actionPayload?: string | null;
  actionStatus?: string | null;
}

export interface AgentContext {
  todayISO: string;
  children: AgentContextChild[];
  history: AgentHistoryMessage[]; // oldest first
}

export interface AgentReply {
  message: string;
  actionType?: AgentActionType;
  actionPayload?: Record<string, unknown>;
}

export interface HomeAgentService {
  respond(userMessage: string, context: AgentContext): Promise<AgentReply>;
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

function nextDateForWeekday(fromISO: string, weekday: number): string {
  let d = new Date(fromISO + "T00:00:00");
  for (let i = 0; i < 8; i++) {
    const iso = d.getDay() === 0 ? 7 : d.getDay();
    if (iso === weekday) return format(d, "yyyy-MM-dd");
    d = addDays(d, 1);
  }
  return fromISO;
}

function addDaysISO(fromISO: string, days: number): string {
  return format(addDays(new Date(fromISO + "T00:00:00"), days), "yyyy-MM-dd");
}

function resolveDate(lower: string, todayISO: string): { dateISO: string; label: string } {
  if (lower.includes("morgen")) return { dateISO: addDaysISO(todayISO, 1), label: "morgen" };
  if (lower.includes("overmorgen")) return { dateISO: addDaysISO(todayISO, 2), label: "overmorgen" };
  if (lower.includes("vandaag")) return { dateISO: todayISO, label: "vandaag" };
  for (const [word, weekday] of Object.entries(WEEKDAY_WORDS)) {
    if (lower.includes(word)) return { dateISO: nextDateForWeekday(todayISO, weekday), label: word };
  }
  // No date mentioned — a spontaneous cancellation report is almost always about the next school day.
  return { dateISO: addDaysISO(todayISO, 1), label: "morgen" };
}

const SCHOOL_CANCEL_WORDS = [
  "uitgevallen",
  "uitvallen",
  "afgelast",
  "gaat niet door",
  "vervalt",
  "dicht",
  "gesloten",
  "geannuleerd",
  "gecancelled",
  "cancelled",
  "gecanceld",
  "canceled",
];

function detectSchoolCancellation(lower: string, todayISO: string): { dateISO: string; label: string } | null {
  if (!lower.includes("school")) return null;
  if (!SCHOOL_CANCEL_WORDS.some((w) => lower.includes(w))) return null;
  return resolveDate(lower, todayISO);
}

function cleanTopic(raw: string): string {
  return raw
    .split(/[.!?\n,]/)[0]
    .replace(/\b(aub|alsjeblieft|graag)\b/gi, "")
    .trim();
}

const FOCUS_PATTERNS = [
  /focus(?:sen)?\s*(?:deze week)?\s*(?:ook\s+)?legg?en\s+op\s+(.+)/i,
  /(?:ik wil|we willen|laten we)\s+(?:deze week\s+)?focussen op\s+(.+)/i,
  /focus(?:sen)?\s*(?:deze week)?\s*op\s+(.+)/i,
  /(?:deze week\s+)?(?:willen we|wil ik)\s+(.+?)\s+(?:oefenen|leren)/i,
];

function detectFocusIntent(message: string): string | null {
  for (const pattern of FOCUS_PATTERNS) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const topic = cleanTopic(match[1]);
      if (topic.length > 1) return topic;
    }
  }
  return null;
}

const ACTIVITY_REQUEST_WORDS = ["bedenk", "verzin", "activiteiten", "ideeën", "ideeen"];

function detectActivityIdeaRequest(message: string, lower: string, lastTopic: string | null): string | null {
  const hasRequestWord = ACTIVITY_REQUEST_WORDS.some((w) => lower.includes(w));
  if (!hasRequestWord) return null;

  const forMatch = message.match(/(?:voor|rond|over)\s+(.+)/i);
  if (forMatch?.[1]) {
    const topic = cleanTopic(forMatch[1]);
    if (topic.length > 1) return topic;
  }
  return lastTopic;
}

function matchChildren(lower: string, children: AgentContextChild[]): AgentContextChild[] {
  if (/\b(allebei|beide|alle kinderen|alle twee)\b/.test(lower)) return children;
  const matched = children.filter((c) => lower.includes(c.name.toLowerCase()));
  return matched;
}

/** Finds the most recently discussed topic, from any create_learning_focus or clarify_child turn. */
function findLastTopic(history: AgentHistoryMessage[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.actionType === "create_learning_focus" || m.actionType === "clarify_child") {
      try {
        const payload = JSON.parse(m.actionPayload ?? "{}");
        if (typeof payload.topic === "string") return payload.topic;
      } catch {
        // ignore malformed history payloads
      }
    }
  }
  return null;
}

async function buildLearningFocusReply(
  topic: string,
  targetChildren: AgentContextChild[],
  suggester = getActivitySuggesterService()
): Promise<AgentReply> {
  const ages = targetChildren.map((c) => c.ageYears);
  const activities: SuggestedActivity[] = await suggester.suggest({
    topic,
    ageRangeMin: Math.min(...ages),
    ageRangeMax: Math.max(...ages),
    count: 4,
  });

  const names = targetChildren.map((c) => c.name).join(" en ");
  const lines = activities.map((a) => `• ${a.icon} **${a.title}** (${a.durationMinutes} min)`).join("\n");

  return {
    message: `Hier is een voorstel om deze week te focussen op "${topic}" voor ${names}:\n\n${lines}\n\nZal ik dit toevoegen aan de planning? Dan plan ik ze deze week in op momenten die passen.`,
    actionType: "create_learning_focus",
    actionPayload: { topic, childIds: targetChildren.map((c) => c.id), activities },
  };
}

export class RuleBasedHomeAgentService implements HomeAgentService {
  async respond(userMessage: string, context: AgentContext): Promise<AgentReply> {
    const lower = userMessage.toLowerCase();
    const lastAssistant = [...context.history].reverse().find((m) => m.role === "assistant");

    // Resolve a pending "voor wie?" question from the previous turn.
    if (lastAssistant?.actionType === "clarify_child" && lastAssistant.actionStatus === "proposed") {
      let topic = "";
      try {
        topic = (JSON.parse(lastAssistant.actionPayload ?? "{}").topic as string) ?? "";
      } catch {
        topic = "";
      }
      const matched = matchChildren(lower, context.children);
      if (matched.length === 0) {
        return {
          message: `Sorry, ik snap niet helemaal voor wie. Noem een naam (${context.children
            .map((c) => c.name)
            .join(", ")}), of zeg "allebei".`,
        };
      }
      return buildLearningFocusReply(topic, matched);
    }

    const cancellation = detectSchoolCancellation(lower, context.todayISO);
    if (cancellation) {
      return {
        message: `Duidelijk — school is ${cancellation.label} afgelast. Zal ik dit doorvoeren? Dan haal ik de schoolroutine weg voor die dag; geplande leeractiviteiten blijven gewoon staan of schuiven mee naar de vrijgekomen tijd.`,
        actionType: "cancel_school",
        actionPayload: { dateISO: cancellation.dateISO, childId: null },
      };
    }

    const focusTopic = detectFocusIntent(userMessage);
    if (focusTopic) {
      if (context.children.length > 1) {
        return {
          message: `Leuk idee! Voor wie wil je dit inplannen: ${context.children.map((c) => c.name).join(", ")}, of allebei?`,
          actionType: "clarify_child",
          actionPayload: { topic: focusTopic },
        };
      }
      return buildLearningFocusReply(focusTopic, context.children);
    }

    const activityTopic = detectActivityIdeaRequest(userMessage, lower, findLastTopic(context.history));
    if (activityTopic) {
      if (context.children.length > 1) {
        return {
          message: `Voor wie zoek je activiteiten: ${context.children.map((c) => c.name).join(", ")}, of allebei?`,
          actionType: "clarify_child",
          actionPayload: { topic: activityTopic },
        };
      }
      return buildLearningFocusReply(activityTopic, context.children);
    }

    return {
      message:
        'Dat begrijp ik nog niet helemaal. Je kunt me bijvoorbeeld vertellen dat school uitvalt ("school is morgen afgelast"), me vragen om deze week op iets te focussen ("focus deze week op tandenpoetsen"), of om leuke activiteiten te bedenken.',
    };
  }
}

export function getHomeAgentService(): HomeAgentService {
  return new RuleBasedHomeAgentService();
}
