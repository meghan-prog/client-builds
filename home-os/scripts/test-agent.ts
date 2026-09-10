import { prisma } from "../src/lib/db";
import { getPrimaryFamilyId } from "../src/lib/data/family";
import { sendUserMessage, applyAgentAction, getConversation } from "../src/lib/data/agent";

async function printLast(familyId: string, n: number) {
  const msgs = await getConversation(familyId);
  for (const m of msgs.slice(-n)) {
    console.log(`[${m.role}] ${m.content}`);
    if (m.actionType) console.log(`   -> actionType=${m.actionType} status=${m.actionStatus} payload=${m.actionPayload?.slice(0, 200)}`);
  }
}

async function main() {
  const familyId = await getPrimaryFamilyId();

  console.log("=== Turn 1: school cancellation ===");
  await sendUserMessage(familyId, "Morgen is opeens de school gecancelled");
  await printLast(familyId, 2);

  console.log("\n=== Turn 2: focus this week (ambiguous child) ===");
  await sendUserMessage(familyId, "Ik wil de focus deze week leggen op tanden leren poetsen, hoe gaan we dit aanpakken?");
  await printLast(familyId, 2);

  console.log("\n=== Turn 3: resolve which child ===");
  await sendUserMessage(familyId, "Allebei");
  await printLast(familyId, 2);

  console.log("\n=== Apply the school cancellation proposal ===");
  const allMsgs = await getConversation(familyId);
  const cancelMsg = allMsgs.find((m) => m.actionType === "cancel_school" && m.actionStatus === "proposed");
  if (cancelMsg) {
    await applyAgentAction(cancelMsg.id);
    console.log("Applied cancel_school.");
  } else {
    console.log("No open cancel_school proposal found!");
  }

  console.log("\n=== Apply the learning-focus proposal ===");
  const focusMsg = (await getConversation(familyId)).find(
    (m) => m.actionType === "create_learning_focus" && m.actionStatus === "proposed"
  );
  if (focusMsg) {
    await applyAgentAction(focusMsg.id);
    console.log("Applied create_learning_focus.");
  } else {
    console.log("No open create_learning_focus proposal found!");
  }

  console.log("\n=== Final conversation ===");
  await printLast(familyId, 10);

  console.log("\n=== Verify DB state ===");
  const goals = await prisma.learningGoal.findMany({ where: { child: { familyId }, title: { contains: "tandenpoetsen" } } });
  const allTandenGoals = await prisma.learningGoal.findMany({ where: { child: { familyId } } });
  console.log("All goals:", allTandenGoals.map((g) => g.title));
  for (const g of goals) {
    const acts = await prisma.learningActivity.findMany({ where: { skill: { goalId: g.id } } });
    console.log(`Goal "${g.title}" activities:`, acts.map((a) => a.title));
  }

  const cancelledEvent = await prisma.schoolEvent.findFirst({ where: { type: "school_cancelled" } });
  console.log("Cancelled school event:", cancelledEvent?.title, cancelledEvent?.startDate);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
