import { getPrimaryFamilyId } from "@/lib/data/family";
import { getConversation } from "@/lib/data/agent";
import AssistantChat from "@/components/AssistantChat";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const familyId = await getPrimaryFamilyId();
  const messages = await getConversation(familyId);

  return (
    <AssistantChat
      messages={messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        actionType: m.actionType,
        actionPayload: m.actionPayload,
        actionStatus: m.actionStatus,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
