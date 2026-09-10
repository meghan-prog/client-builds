import { prisma } from "../src/lib/db";
import { getPrimaryFamilyId } from "../src/lib/data/family";
import { generateAndPersistWeekPlan, getWeekPlanView } from "../src/lib/data/planning";
import { format, startOfWeek } from "date-fns";

async function main() {
  const familyId = await getPrimaryFamilyId();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  console.log("Family:", familyId, "Week:", weekStart);

  const { unscheduled } = await generateAndPersistWeekPlan(familyId, weekStart);
  console.log("Unscheduled:", unscheduled);

  const { blocks, conflicts, deviations } = await getWeekPlanView(familyId, weekStart);
  console.log(`\nBlocks: ${blocks.length}`);
  for (const b of blocks) {
    console.log(
      `${format(b.date, "EEE dd/MM")} ${b.startTime}-${b.endTime} [${b.category}]${b.isFreeSpace ? " (free)" : ""}${
        b.hasConflict ? " CONFLICT" : ""
      } ${b.icon} ${b.title}${b.child ? " -> " + b.child.name : ""}`
    );
  }

  console.log(`\nConflicts: ${conflicts.length}`);
  for (const c of conflicts) console.log(` - ${format(c.date, "EEE dd/MM")}: ${c.description}`);

  console.log(`\nDeviations: ${deviations.length}`);
  for (const d of deviations) console.log(` - ${format(d.date, "EEE dd/MM")}: ${d.icon} ${d.title}`);

  const shoppingItems = await prisma.shoppingItem.findMany({ where: { familyId } });
  console.log(`\nShopping items: ${shoppingItems.length}`);
  for (const s of shoppingItems) console.log(` - ${s.name}: ${s.reason}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
