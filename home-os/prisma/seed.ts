import { PrismaClient } from "@prisma/client";
import { addDays, format, startOfWeek } from "date-fns";

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const j = (arr: unknown) => JSON.stringify(arr);

/**
 * Exported so it can be reused against any PrismaClient instance — the CLI
 * entrypoint below (`tsx prisma/seed.ts`, local SQLite) and
 * `scripts/setup-turso.ts` (one-shot production setup, Turso) both call
 * this with their own client rather than duplicating the seed data.
 */
export async function seedHomeOS(prisma: PrismaClient) {
  console.log("Seeding Home OS for jullie eigen gezin...");

  await prisma.deviation.deleteMany();
  await prisma.conflict.deleteMany();
  await prisma.scheduleBlock.deleteMany();
  await prisma.weekPlan.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.scheduledActivity.deleteMany();
  await prisma.learningActivityMaterial.deleteMany();
  await prisma.learningActivity.deleteMany();
  await prisma.learningSkill.deleteMany();
  await prisma.learningGoal.deleteMany();
  await prisma.material.deleteMany();
  await prisma.householdTaskCompletion.deleteMany();
  await prisma.householdTask.deleteMany();
  await prisma.workBlock.deleteMany();
  await prisma.workProfile.deleteMany();
  await prisma.schoolEvent.deleteMany();
  await prisma.schoolYear.deleteMany();
  await prisma.schoolCalendarUpload.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.calendar.deleteMany();
  await prisma.routineChild.deleteMany();
  await prisma.routine.deleteMany();
  await prisma.routineTemplate.deleteMany();
  await prisma.weeklyIntention.deleteMany();
  await prisma.child.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.family.deleteMany();

  // ---------------------------------------------------------------------
  // FAMILY
  // ---------------------------------------------------------------------
  const family = await prisma.family.create({ data: { name: "Ons gezin" } });

  const meghan = await prisma.parent.create({
    data: {
      familyId: family.id,
      name: "Meghan",
      email: "meghan.eckenbach@gmail.com",
    },
  });

  const david = await prisma.parent.create({
    data: {
      familyId: family.id,
      name: "David",
      // Placeholder — er is nog geen scherm om dit in de app zelf aan te passen.
      email: "david@thuis.local",
    },
  });

  const lois = await prisma.child.create({
    data: {
      familyId: family.id,
      name: "Loïs",
      birthDate: new Date("2021-10-15"),
      avatarEmoji: "👧",
      colorHex: "#D98C7A",
    },
  });

  const may = await prisma.child.create({
    data: {
      familyId: family.id,
      name: "May",
      birthDate: new Date("2023-12-15"),
      avatarEmoji: "👶",
      colorHex: "#B08FD9",
    },
  });

  // ---------------------------------------------------------------------
  // BASE: routine template catalog + dit gezin se routines
  // ---------------------------------------------------------------------
  const templateDefs = [
    { key: "wake_up", title: "Opstaan", defaultIcon: "☀️", defaultCategory: "wake" },
    { key: "breakfast", title: "Ontbijt", defaultIcon: "🥣", defaultCategory: "meal" },
    { key: "dress", title: "Aankleden", defaultIcon: "👕", defaultCategory: "hygiene" },
    { key: "brush_teeth", title: "Tandenpoetsen", defaultIcon: "🪥", defaultCategory: "hygiene" },
    { key: "pack_bag", title: "Tas pakken", defaultIcon: "🎒", defaultCategory: "hygiene" },
    { key: "to_school", title: "Naar school", defaultIcon: "🚶", defaultCategory: "school" },
    { key: "school", title: "School", defaultIcon: "🏫", defaultCategory: "school" },
    { key: "pickup", title: "Ophalen", defaultIcon: "🚗", defaultCategory: "school" },
    { key: "snack", title: "Snack", defaultIcon: "🍎", defaultCategory: "snack" },
    { key: "afternoon", title: "Middag", defaultIcon: "🌿", defaultCategory: "afternoon" },
    { key: "dinner", title: "Avondeten", defaultIcon: "🍽️", defaultCategory: "meal" },
    { key: "shower", title: "Douchen", defaultIcon: "🛁", defaultCategory: "hygiene" },
    { key: "reading", title: "Lezen", defaultIcon: "📖", defaultCategory: "bedtime" },
    { key: "bedtime", title: "Bedtijd", defaultIcon: "🌙", defaultCategory: "bedtime" },
  ];
  const templates: Record<string, { id: string }> = {};
  for (const t of templateDefs) {
    templates[t.key] = await prisma.routineTemplate.create({ data: t });
  }

  const weekdays = [1, 2, 3, 4, 5];
  const allDays = [1, 2, 3, 4, 5, 6, 7];

  // Tijden zoals opgegeven: opstaan 07:30, vertrek school 08:45, thuiskomst
  // 14:00-14:30, 1,5 uur middag voor educatieve activiteiten (dus tot 16:00),
  // avondeten 18:00-18:30, bedroutine vanaf 19:15.
  const routineDefs: {
    key: string;
    title: string;
    category: string;
    icon: string;
    start: string;
    end: string;
    days: number[];
    freeSpace?: boolean;
  }[] = [
    { key: "wake_up", title: "Opstaan", category: "wake", icon: "☀️", start: "07:30", end: "07:50", days: allDays },
    { key: "breakfast", title: "Ontbijt", category: "meal", icon: "🥣", start: "07:50", end: "08:10", days: allDays },
    { key: "dress", title: "Aankleden", category: "hygiene", icon: "👕", start: "08:10", end: "08:25", days: allDays },
    { key: "brush_teeth", title: "Tandenpoetsen", category: "hygiene", icon: "🪥", start: "08:25", end: "08:30", days: allDays },
    { key: "pack_bag", title: "Tas pakken", category: "hygiene", icon: "🎒", start: "08:30", end: "08:45", days: weekdays },
    { key: "to_school", title: "Naar school", category: "school", icon: "🚶", start: "08:45", end: "09:00", days: weekdays },
    { key: "school", title: "School", category: "school", icon: "🏫", start: "09:00", end: "14:00", days: weekdays },
    { key: "pickup", title: "Ophalen", category: "school", icon: "🚗", start: "14:00", end: "14:30", days: weekdays },
    { key: "snack", title: "Snack", category: "snack", icon: "🍎", start: "14:30", end: "14:45", days: weekdays },
    {
      key: "afternoon",
      title: "Middag",
      category: "afternoon",
      icon: "🌿",
      start: "14:30",
      end: "16:00",
      days: weekdays,
      freeSpace: true,
    },
    { key: "dinner", title: "Avondeten", category: "meal", icon: "🍽️", start: "18:00", end: "18:30", days: allDays },
    { key: "shower", title: "Douchen", category: "hygiene", icon: "🛁", start: "19:15", end: "19:30", days: allDays },
    { key: "reading", title: "Lezen", category: "bedtime", icon: "📖", start: "19:30", end: "19:45", days: allDays },
    { key: "bedtime", title: "Bedtijd", category: "bedtime", icon: "🌙", start: "19:45", end: "20:00", days: allDays },
  ];

  for (const r of routineDefs) {
    await prisma.routine.create({
      data: {
        familyId: family.id,
        templateId: templates[r.key].id,
        title: r.title,
        category: r.category,
        icon: r.icon,
        startTime: r.start,
        endTime: r.end,
        daysOfWeek: j(r.days),
        isFreeSpaceBlock: !!r.freeSpace,
      },
    });
  }

  // ---------------------------------------------------------------------
  // SCHOOL YEAR — placeholder Nederlands schooljaar; vervang via de
  // upload-functie op /school zodra jullie de echte schoolkalender hebben.
  // ---------------------------------------------------------------------
  const schoolYearStart = new Date("2026-09-01");
  const schoolYearEnd = new Date("2027-07-16");
  const schoolYear = await prisma.schoolYear.create({
    data: {
      familyId: family.id,
      label: "2026–2027",
      startDate: schoolYearStart,
      endDate: schoolYearEnd,
    },
  });

  const schoolEventDefs: {
    type: string;
    title: string;
    start: Date;
    end: Date;
    childId?: string | null;
  }[] = [
    { type: "study_day", title: "Studiedag", start: addDays(schoolYearStart, 15), end: addDays(schoolYearStart, 15), childId: null },
    { type: "parent_evening", title: "Ouderavond", start: addDays(schoolYearStart, 20), end: addDays(schoolYearStart, 20), childId: null },
    { type: "school_trip", title: "Schoolreis", start: addDays(schoolYearStart, 38), end: addDays(schoolYearStart, 38), childId: lois.id },
    { type: "holiday", title: "Herfstvakantie", start: addDays(schoolYearStart, 48), end: addDays(schoolYearStart, 52), childId: null },
    { type: "holiday", title: "Kerstvakantie", start: addDays(schoolYearStart, 112), end: addDays(schoolYearStart, 126), childId: null },
    { type: "study_day", title: "Studiedag", start: addDays(schoolYearStart, 137), end: addDays(schoolYearStart, 137), childId: null },
    { type: "holiday", title: "Voorjaarsvakantie", start: addDays(schoolYearStart, 167), end: addDays(schoolYearStart, 171), childId: null },
    { type: "school_activity", title: "Sportdag", start: addDays(schoolYearStart, 187), end: addDays(schoolYearStart, 187), childId: null },
  ];

  for (const e of schoolEventDefs) {
    await prisma.schoolEvent.create({
      data: {
        schoolYearId: schoolYear.id,
        childId: e.childId ?? null,
        type: e.type,
        title: e.title,
        startDate: e.start,
        endDate: e.end,
        source: "manual",
      },
    });
  }

  // Leeg gezinskalender — jullie eigen afspraken voeg je toe via de
  // assistent of de zondagse input.
  await prisma.calendar.create({
    data: { familyId: family.id, type: "family", name: "Gezinskalender" },
  });

  // ---------------------------------------------------------------------
  // WORK — Meghan werkt op werkdagen 09:30-13:30. David's werktijden zijn
  // nog niet ingevuld; voeg toe via Instellingen zodra bekend.
  // ---------------------------------------------------------------------
  const normalProfile = await prisma.workProfile.create({
    data: { parentId: meghan.id, name: "Normale week", isDefault: true },
  });
  for (const day of weekdays) {
    await prisma.workBlock.create({
      data: { workProfileId: normalProfile.id, dayOfWeek: day, startTime: "09:30", endTime: "13:30", label: "Werk" },
    });
  }
  await prisma.workProfile.create({ data: { parentId: meghan.id, name: "Launch week", isDefault: false } });
  await prisma.workProfile.create({ data: { parentId: meghan.id, name: "Vakantieweek", isDefault: false } });

  // ---------------------------------------------------------------------
  // MATERIALS / INVENTORY — "missing" hier is een aanname (niet elk gezin
  // heeft een zandloper of plaque-tabletten klaarliggen); via de
  // boodschappenlijst zet je dat recht zodra iets daadwerkelijk gekocht is.
  // ---------------------------------------------------------------------
  const materialNames = ["papier", "potlood", "boek", "letterkaarten", "dobbelsteen", "bladeren", "schaar", "lijm"];
  const materials: Record<string, { id: string }> = {};
  for (const name of materialNames) {
    materials[name] = await prisma.material.create({ data: { name, category: "leren" } });
  }
  const inventoryStatus: Record<string, string> = {
    papier: "present",
    potlood: "present",
    boek: "present",
    letterkaarten: "present",
    dobbelsteen: "missing",
    bladeren: "present",
    schaar: "present",
    lijm: "missing",
  };
  for (const [name, status] of Object.entries(inventoryStatus)) {
    await prisma.inventoryItem.create({
      data: { familyId: family.id, materialId: materials[name].id, status },
    });
  }

  // ---------------------------------------------------------------------
  // LEERDOEL — Loïs: leren lezen en schrijven (jaar -> maand -> week -> activiteiten)
  // ---------------------------------------------------------------------
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
  const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);

  const loisGoal = await prisma.learningGoal.create({
    data: {
      childId: lois.id,
      title: "Dit schooljaar leren lezen en schrijven",
      description: "Loïs leert dit schooljaar letters herkennen, woorden lezen en haar eerste woorden schrijven.",
      startDate: schoolYearStart,
      endDate: schoolYearEnd,
      desiredSkillsText: "Letters herkennen, klanken koppelen, korte woorden lezen, eigen naam en korte woorden schrijven.",
      progress: 0,
    },
  });

  const loisYearSkill = await prisma.learningSkill.create({
    data: {
      goalId: loisGoal.id,
      period: "year",
      title: "Leren lezen en schrijven",
      periodStart: schoolYearStart,
      periodEnd: schoolYearEnd,
    },
  });

  const loisMonthSkill = await prisma.learningSkill.create({
    data: {
      goalId: loisGoal.id,
      parentSkillId: loisYearSkill.id,
      period: "month",
      title: "Letters herkennen",
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
  });

  const loisWeekSkill = await prisma.learningSkill.create({
    data: {
      goalId: loisGoal.id,
      parentSkillId: loisMonthSkill.id,
      period: "week",
      title: "M + S herkennen en M schrijven",
      periodStart: weekStart,
      periodEnd: weekEnd,
    },
  });

  const loisActivityDefs: {
    title: string;
    icon: string;
    duration: number;
    weekday: number;
    instructions: string[];
    materials: string[];
    difficulty: string;
  }[] = [
    {
      title: "M herkennen",
      icon: "🔤",
      duration: 15,
      weekday: 1,
      instructions: [
        "Leg de letterkaarten open op tafel.",
        "Zoek samen de letter M tussen de andere letters.",
        "Benoem drie woorden die met M beginnen.",
        "Laat Loïs de M drie keer aanwijzen in het boek.",
      ],
      materials: ["letterkaarten"],
      difficulty: "makkelijk",
    },
    {
      title: "M schrijven",
      icon: "✏️",
      duration: 15,
      weekday: 3,
      instructions: [
        "Zoek de M in een boek.",
        "Maak de M in de lucht.",
        "Schrijf de M met je vinger.",
        "Schrijf vijf M's op papier.",
      ],
      materials: ["papier", "potlood"],
      difficulty: "makkelijk",
    },
    {
      title: "M zoeken in boeken",
      icon: "📚",
      duration: 15,
      weekday: 4,
      instructions: [
        "Pak een favoriet boek.",
        "Zoek samen naar woorden die met M beginnen.",
        "Streep ze niet aan, maar wijs ze aan en lees ze hardop.",
        "Tel hoeveel M's jullie gevonden hebben.",
      ],
      materials: ["boek"],
      difficulty: "makkelijk",
    },
    {
      title: "Herhalingsspel M",
      icon: "🎲",
      duration: 15,
      weekday: 5,
      instructions: [
        "Gooi met de dobbelsteen.",
        "Bij elk getal noemt Loïs een woord met M.",
        "Schrijf de gevonden woorden samen op.",
        "Vier het einde van de week met een klein applaus.",
      ],
      materials: ["dobbelsteen"],
      difficulty: "gemiddeld",
    },
  ];

  for (const a of loisActivityDefs) {
    const activity = await prisma.learningActivity.create({
      data: {
        skillId: loisWeekSkill.id,
        title: a.title,
        icon: a.icon,
        ageRangeMin: 4,
        ageRangeMax: 7,
        durationMinutes: a.duration,
        instructions: j(a.instructions),
        prepMinutes: 0,
        location: "Thuis",
        difficulty: a.difficulty,
        preferredWeekday: a.weekday,
      },
    });
    for (const mName of a.materials) {
      await prisma.learningActivityMaterial.create({
        data: { activityId: activity.id, materialId: materials[mName].id },
      });
    }
  }

  // ---------------------------------------------------------------------
  // LEERDOEL — May (bijna 3): leeftijdspassend voorstel, kleuren en vormen
  // ---------------------------------------------------------------------
  const mayGoal = await prisma.learningGoal.create({
    data: {
      childId: may.id,
      title: "Kleuren en vormen ontdekken",
      description: "May ontdekt kleuren, vormen en de wereld om haar heen — te beginnen met de herfst.",
      startDate: schoolYearStart,
      endDate: schoolYearEnd,
      desiredSkillsText: "Kleuren benoemen, vormen herkennen, natuurmateriaal ontdekken, een kleine knutselopdracht afmaken.",
      progress: 0,
    },
  });
  const mayYearSkill = await prisma.learningSkill.create({
    data: {
      goalId: mayGoal.id,
      period: "year",
      title: "Kleuren en vormen ontdekken",
      periodStart: schoolYearStart,
      periodEnd: schoolYearEnd,
    },
  });
  const mayMonthSkill = await prisma.learningSkill.create({
    data: {
      goalId: mayGoal.id,
      parentSkillId: mayYearSkill.id,
      period: "month",
      title: "Herfstkleuren ontdekken",
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
  });
  const mayWeekSkill = await prisma.learningSkill.create({
    data: {
      goalId: mayGoal.id,
      parentSkillId: mayMonthSkill.id,
      period: "week",
      title: "Rood en geel herkennen",
      periodStart: weekStart,
      periodEnd: weekEnd,
    },
  });

  const herfstcollage = await prisma.learningActivity.create({
    data: {
      skillId: mayWeekSkill.id,
      title: "Herfstcollage maken",
      icon: "🍂",
      ageRangeMin: 2,
      ageRangeMax: 4,
      durationMinutes: 20,
      instructions: j([
        "Verzamel samen bladeren buiten.",
        "Leg de bladeren in een mooi patroon op het papier.",
        "Plak de bladeren vast met lijm.",
        "Laat het knutselwerk drogen en hang het op.",
      ]),
      prepMinutes: 5,
      location: "Buiten + thuis",
      difficulty: "makkelijk",
      preferredWeekday: 2,
      themeKey: "herfst_nl",
    },
  });
  for (const mName of ["bladeren", "papier", "schaar", "lijm"]) {
    await prisma.learningActivityMaterial.create({
      data: { activityId: herfstcollage.id, materialId: materials[mName].id },
    });
  }

  await prisma.learningActivity.create({
    data: {
      skillId: mayWeekSkill.id,
      title: "Kleuren zoektocht",
      icon: "🌈",
      ageRangeMin: 2,
      ageRangeMax: 4,
      durationMinutes: 15,
      instructions: j([
        "Kies twee kleuren: rood en geel.",
        "Loop samen door huis op zoek naar rode dingen.",
        "Loop samen door huis op zoek naar gele dingen.",
        "Leg de gevonden spullen in twee groepjes en benoem de kleuren samen.",
      ]),
      prepMinutes: 0,
      location: "Thuis",
      difficulty: "makkelijk",
      preferredWeekday: 5,
    },
  });

  // ---------------------------------------------------------------------
  // HUISHOUDELIJKE TAKEN — niet expliciet opgegeven, dit zijn voorbeelden;
  // pas ze aan via de assistent of Prisma Studio.
  // ---------------------------------------------------------------------
  await prisma.householdTask.create({
    data: {
      familyId: family.id,
      title: "Boodschappen doen",
      icon: "🛒",
      category: "shopping",
      daysOfWeek: j([2]),
      preferredTime: "16:15",
      durationMinutes: 45,
      isRequired: true,
    },
  });
  await prisma.householdTask.create({
    data: {
      familyId: family.id,
      title: "Was opruimen",
      icon: "🧺",
      category: "household",
      daysOfWeek: j([1, 3, 5]),
      preferredTime: "20:00",
      durationMinutes: 20,
      isRequired: true,
    },
  });
  await prisma.householdTask.create({
    data: {
      familyId: family.id,
      title: "Speelgoed opruimen",
      icon: "🧸",
      category: "household",
      daysOfWeek: j(weekdays),
      preferredTime: "17:30",
      durationMinutes: 10,
      isRequired: false,
      assignedChildId: lois.id,
    },
  });
  await prisma.householdTask.create({
    data: {
      familyId: family.id,
      title: "Tafel dekken",
      icon: "🍽️",
      category: "household",
      daysOfWeek: j(allDays),
      preferredTime: "17:50",
      durationMinutes: 10,
      isRequired: false,
      assignedChildId: may.id,
    },
  });

  console.log("Seed complete:");
  console.log(`  Gezin: ${family.name} (${family.id})`);
  console.log(`  Ouders: ${meghan.name}, ${david.name}`);
  console.log(`  Kinderen: ${lois.name} (${lois.birthDate.toDateString()}), ${may.name} (${may.birthDate.toDateString()})`);
  console.log(`  Deze week start: ${iso(weekStart)}`);
}

const isMainModule = process.argv[1]?.endsWith("seed.ts");
if (isMainModule) {
  const prisma = new PrismaClient();
  seedHomeOS(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
