// Home OS assistant — abstraction layer.
//
// Two implementations: a rule-based mock (pattern matching on fixed
// phrases — the original MVP, kept as a no-API-key fallback) and
// ClaudeHomeAgentService, which uses the real Claude Messages API with
// tool use so it understands free-form Dutch instead of fixed phrases.
// `getHomeAgentService()` picks whichever is available. Both only ever
// produce the `AgentReply` shape below — the chat UI and the action-
// execution code (src/lib/data/agent.ts) never know which one answered.

import Anthropic from "@anthropic-ai/sdk";
import { addDays, format } from "date-fns";
import { getActivitySuggesterService, type SuggestedActivity } from "./activity-suggester";

export type AgentActionType =
  | "clarify_child"
  | "cancel_school"
  | "create_learning_focus"
  | "add_calendar_event";

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

const CLAUDE_TOOLS: Anthropic.Tool[] = [
  {
    name: "report_school_cancellation",
    description:
      "Meld dat school niet doorgaat op een specifieke dag, zodat de schoolroutine die dag verdwijnt uit de planning en de week opnieuw wordt ingepland. Gebruik een concrete datum (YYYY-MM-DD), zelf berekend uit relatieve woorden als 'morgen' aan de hand van vandaag's datum.",
    input_schema: {
      type: "object",
      properties: {
        dateISO: { type: "string", description: "Datum waarop school niet doorgaat, formaat YYYY-MM-DD." },
        childId: {
          type: "string",
          description:
            "ID van het specifieke kind waar dit over gaat, alleen als het niet voor alle kinderen geldt. Leeg laten als het om school in het algemeen gaat.",
        },
      },
      required: ["dateISO"],
    },
  },
  {
    name: "create_learning_focus",
    description:
      "Stel een leerfocus/thema in voor deze week voor één of meer kinderen, of bedenk leuke leeractiviteiten rond een onderwerp. Dit haalt passende activiteiten op en stelt voor ze aan de weekplanning toe te voegen.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Het onderwerp/de vaardigheid, bijv. 'tandenpoetsen'." },
        childIds: {
          type: "array",
          items: { type: "string" },
          description: "IDs van de kinderen waar dit voor is.",
        },
      },
      required: ["topic", "childIds"],
    },
  },
  {
    name: "add_calendar_event",
    description:
      "Voeg een eenmalige afspraak of geplande activiteit toe aan de gezinsagenda op een specifieke datum, bijv. een boodschap, uitje, of afspraak.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Korte titel van de afspraak." },
        dateISO: { type: "string", description: "Datum, formaat YYYY-MM-DD." },
        startTime: { type: "string", description: "Starttijd HH:MM, leeg laten als er geen specifieke tijd is." },
        endTime: { type: "string", description: "Eindtijd HH:MM, leeg laten als er geen specifieke tijd is." },
        notes: { type: "string", description: "Eventuele extra details, leeg laten als niet van toepassing." },
      },
      required: ["title", "dateISO"],
    },
  },
];

function claudeSystemPrompt(context: AgentContext): string {
  const childrenList = context.children.map((c) => `- ${c.name} (id: ${c.id}, ${c.ageYears} jaar)`).join("\n");
  return `Je bent de assistent in Home OS, een Nederlandstalige gezinsplanner-app. Je praat kort, warm en to-the-point in het Nederlands met de ouders.

Vandaag is ${context.todayISO} (YYYY-MM-DD).

Kinderen in dit gezin:
${childrenList || "(geen kinderen bekend)"}

Wat je kunt:
- Schoolafmeldingen doorvoeren (report_school_cancellation)
- Een leerfocus voor de week instellen of activiteiten bedenken (create_learning_focus)
- Een eenmalige afspraak toevoegen aan de agenda (add_calendar_event)

Regels:
- Bereken relatieve datums ("morgen", "volgende week woensdag") zelf op basis van vandaag's datum hierboven.
- Roep een tool pas aan als je zeker genoeg bent wat de gebruiker bedoelt; vraag anders kort door in gewone tekst (bijv. voor welk kind, of welke datum/tijd).
- Als een bericht meerdere losse verzoeken bevat, behandel dan alleen het meest concrete/duidelijke verzoek nu, en vraag de gebruiker de rest in een apart bericht te sturen.
- Schrijf bij elke tool-aanroep ook een korte begeleidende tekst die samenvat wat je gaat doen en om bevestiging vraagt (de gebruiker moet nog op een knop klikken voordat het echt wordt doorgevoerd — jij voert niets zelf uit).
- Geef nooit puur een tool-aanroep zonder begeleidende tekst.`;
}

function toAnthropicHistory(history: AgentHistoryMessage[]): Anthropic.MessageParam[] {
  return history
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

export class ClaudeHomeAgentService implements HomeAgentService {
  private client = new Anthropic();

  async respond(userMessage: string, context: AgentContext): Promise<AgentReply> {
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: "claude-opus-5",
        max_tokens: 2048,
        output_config: { effort: "low" },
        system: claudeSystemPrompt(context),
        tools: CLAUDE_TOOLS,
        messages: [...toAnthropicHistory(context.history), { role: "user", content: userMessage }],
      });
    } catch (error) {
      const detail = error instanceof Anthropic.APIError ? error.message : String(error);
      return { message: `Sorry, de assistent is even niet bereikbaar (${detail}). Probeer het straks nog eens.` };
    }

    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    const message = textBlocks.map((b) => b.text).join("\n").trim();
    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    if (!toolUse) {
      return { message: message || "Sorry, daar weet ik zo niet direct raad mee." };
    }

    const input = toolUse.input as Record<string, unknown>;

    if (toolUse.name === "report_school_cancellation") {
      return {
        message,
        actionType: "cancel_school",
        actionPayload: { dateISO: input.dateISO as string, childId: (input.childId as string) || null },
      };
    }

    if (toolUse.name === "add_calendar_event") {
      return {
        message,
        actionType: "add_calendar_event",
        actionPayload: {
          title: input.title as string,
          dateISO: input.dateISO as string,
          startTime: (input.startTime as string) || null,
          endTime: (input.endTime as string) || null,
          notes: (input.notes as string) || null,
        },
      };
    }

    if (toolUse.name === "create_learning_focus") {
      const topic = input.topic as string;
      const childIds = (input.childIds as string[]) ?? [];
      const targetChildren = context.children.filter((c) => childIds.includes(c.id));
      const reply = await buildLearningFocusReply(topic, targetChildren.length > 0 ? targetChildren : context.children);
      return { ...reply, message: message || reply.message };
    }

    return { message: message || "Sorry, daar weet ik zo niet direct raad mee." };
  }
}

export function getHomeAgentService(): HomeAgentService {
  if (process.env.ANTHROPIC_API_KEY) return new ClaudeHomeAgentService();
  return new RuleBasedHomeAgentService();
}
