import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getHomeAgentService, type AgentContext } from "@/lib/ai/agent";
import { ageFromBirthDate } from "@/lib/data/children";
import { createLearningFocus } from "@/lib/data/learning";
import { reportSchoolCancellation } from "@/lib/data/school";

export async function getConversation(familyId: string) {
  return prisma.agentMessage.findMany({ where: { familyId }, orderBy: { createdAt: "asc" } });
}

/** Posts the user's message, runs the assistant, and persists its reply — the full round trip for one chat turn. */
export async function sendUserMessage(familyId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const [children, history] = await Promise.all([
    prisma.child.findMany({ where: { familyId } }),
    prisma.agentMessage.findMany({ where: { familyId }, orderBy: { createdAt: "asc" } }),
  ]);

  await prisma.agentMessage.create({ data: { familyId, role: "user", content: trimmed } });

  const context: AgentContext = {
    todayISO: format(new Date(), "yyyy-MM-dd"),
    children: children.map((c) => ({ id: c.id, name: c.name, ageYears: ageFromBirthDate(c.birthDate) })),
    history: history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
      actionType: h.actionType,
      actionPayload: h.actionPayload,
      actionStatus: h.actionStatus,
    })),
  };

  const reply = await getHomeAgentService().respond(trimmed, context);

  await prisma.agentMessage.create({
    data: {
      familyId,
      role: "assistant",
      content: reply.message,
      actionType: reply.actionType ?? null,
      actionPayload: reply.actionPayload ? JSON.stringify(reply.actionPayload) : null,
      actionStatus: reply.actionType ? "proposed" : null,
    },
  });
}

/** Executes the action a still-open assistant message proposed, and posts a confirmation back into the thread. */
export async function applyAgentAction(messageId: string) {
  const message = await prisma.agentMessage.findUniqueOrThrow({ where: { id: messageId } });
  if (!message.actionType || message.actionStatus !== "proposed") {
    return { applied: false as const };
  }
  const payload = JSON.parse(message.actionPayload ?? "{}") as Record<string, unknown>;

  if (message.actionType === "cancel_school") {
    const dateISO = payload.dateISO as string;
    const childId = (payload.childId as string | null) ?? null;
    const { weekStart } = await reportSchoolCancellation(message.familyId, dateISO, childId);
    await prisma.agentMessage.update({ where: { id: messageId }, data: { actionStatus: "applied" } });
    await prisma.agentMessage.create({
      data: {
        familyId: message.familyId,
        role: "assistant",
        content: `Gedaan — school staat nu als afgelast voor ${dateISO}, en ik heb die week opnieuw ingepland.`,
      },
    });
    return { applied: true as const, weekStart };
  }

  if (message.actionType === "create_learning_focus") {
    const topic = payload.topic as string;
    const childIds = payload.childIds as string[];
    const activities = payload.activities as Parameters<typeof createLearningFocus>[3];
    const { weekStart } = await createLearningFocus(message.familyId, topic, childIds, activities);
    await prisma.agentMessage.update({ where: { id: messageId }, data: { actionStatus: "applied" } });
    await prisma.agentMessage.create({
      data: {
        familyId: message.familyId,
        role: "assistant",
        content: `Toegevoegd! Ik heb ${activities.length} activiteiten rond "${topic}" ingepland deze week.`,
      },
    });
    return { applied: true as const, weekStart };
  }

  return { applied: false as const };
}

export async function dismissAgentAction(messageId: string) {
  await prisma.agentMessage.update({ where: { id: messageId }, data: { actionStatus: "dismissed" } });
}
