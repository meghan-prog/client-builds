import { prisma } from "../src/lib/db";
import { getPrimaryFamilyId } from "../src/lib/data/family";
import { generateAndPersistWeekPlan, getWeekPlanView, saveWeeklyIntention } from "../src/lib/data/planning";
import { format, startOfWeek } from "date-fns";

async function main() {
  const familyId = await getPrimaryFamilyId();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const text =
    "Deze week moet ik dinsdag naar de tandarts. Ik moet boodschappen doen. Woensdag wil ik met de kinderen naar het strand. Mijn dochter moet extra oefenen met M en S.";

  const { parsedItems } = await saveWeeklyIntention(familyId, weekStart, text);
  console.log("Parsed intention items:");
  for (const item of parsedItems) {
    console.log(` - [${item.kind}] ${item.icon} ${item.title} on ${item.date} (child: ${item.childId ?? "any"})`);
  }

  await generateAndPersistWeekPlan(familyId, weekStart);
  const { deviations, blocks } = await getWeekPlanView(familyId, weekStart);

  console.log("\nDeviations after processing intentions:");
  for (const d of deviations) console.log(` - ${format(d.date, "EEE dd/MM")}: ${d.icon} ${d.title}`);

  console.log("\nWednesday blocks:");
  for (const b of blocks.filter((b) => format(b.date, "yyyy-MM-dd") === format(new Date(weekStart + "T00:00:00"), "yyyy-MM-dd").slice(0, 8) + "09")) {
    console.log(` - ${b.startTime}-${b.endTime} ${b.icon} ${b.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
