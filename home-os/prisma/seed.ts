import { PrismaClient } from "@prisma/client";
import { addDays, format, startOfWeek } from "date-fns";

const prisma = new PrismaClient();

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const j = (arr: unknown) => JSON.stringify(arr);

async function main() {
  console.log("Seeding Home OS demo family...");

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
  const family = await prisma.family.create({ data: { name: "Familie Eckenbach" } });

  const parent = await prisma.parent.create({
    data: {
      familyId: family.id,
      name: "Meghan",
      email: "meghan.eckenbach@gmail.com",
      kidModePin: "1234",
    },
  });

  const daughter = await prisma.child.create({
    data: {
      familyId: family.id,
      name: "Sofie",
      birthDate: new Date("2020-04-12"),
      avatarEmoji: "👧",
      colorHex: "#D98C7A",
    },
  });

  const son = await prisma.child.create({
    data: {
      familyId: family.id,
      name: "Milo",
      birthDate: new Date("2022-11-03"),
      avatarEmoji: "👦",
      colorHex: "#7C9885",
    },
  });

  // ---------------------------------------------------------------------
  // BASE: routine template catalog + this family's routines
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
    { key: "wake_up", title: "Opstaan", category: "wake", icon: "☀️", start: "07:00", end: "07:20", days: allDays },
    { key: "breakfast", title: "Ontbijt", category: "meal", icon: "🥣", start: "07:20", end: "07:45", days: allDays },
    { key: "dress", title: "Aankleden", category: "hygiene", icon: "👕", start: "07:45", end: "08:00", days: allDays },
    { key: "brush_teeth", title: "Tandenpoetsen", category: "hygiene", icon: "🪥", start: "08:00", end: "08:05", days: allDays },
    { key: "pack_bag", title: "Tas pakken", category: "hygiene", icon: "🎒", start: "08:05", end: "08:15", days: weekdays },
    { key: "to_school", title: "Naar school", category: "school", icon: "🚶", start: "08:15", end: "08:30", days: weekdays },
    { key: "school", title: "School", category: "school", icon: "🏫", start: "08:30", end: "15:00", days: weekdays },
    { key: "pickup", title: "Ophalen", category: "school", icon: "🚗", start: "15:00", end: "15:30", days: weekdays },
    { key: "snack", title: "Snack", category: "snack", icon: "🍎", start: "15:30", end: "15:45", days: weekdays },
    {
      key: "afternoon",
      title: "Middag",
      category: "afternoon",
      icon: "🌿",
      start: "15:30",
      end: "17:30",
      days: weekdays,
      freeSpace: true,
    },
    { key: "dinner", title: "Avondeten", category: "meal", icon: "🍽️", start: "18:00", end: "18:30", days: allDays },
    { key: "shower", title: "Douchen", category: "hygiene", icon: "🛁", start: "18:30", end: "18:45", days: allDays },
    { key: "reading", title: "Lezen", category: "bedtime", icon: "📖", start: "18:45", end: "19:00", days: allDays },
    { key: "bedtime", title: "Bedtijd", category: "bedtime", icon: "🌙", start: "19:00", end: "19:15", days: allDays },
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
  // SCHOOL YEAR
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

  // Anchor a few events to the *current* real week so the app is immediately
  // compelling to open, matching the spec's own "wat is er anders" example.
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const wednesdayThisWeek = addDays(weekStart, 2);
  const fridayThisWeek = addDays(weekStart, 4);

  const schoolEventDefs: {
    type: string;
    title: string;
    start: Date;
    end: Date;
    childId?: string | null;
  }[] = [
    { type: "study_day", title: "Studiedag", start: wednesdayThisWeek, end: wednesdayThisWeek, childId: null },
    { type: "parent_evening", title: "Ouderavond", start: addDays(schoolYearStart, 20), end: addDays(schoolYearStart, 20), childId: null },
    { type: "school_trip", title: "Schoolreis", start: addDays(schoolYearStart, 38), end: addDays(schoolYearStart, 38), childId: daughter.id },
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

  // A birthday appointment this week (Friday) on the family's general calendar.
  const familyCalendar = await prisma.calendar.create({
    data: { familyId: family.id, type: "family", name: "Gezinskalender" },
  });
  await prisma.calendarEvent.create({
    data: {
      calendarId: familyCalendar.id,
      title: "Verjaardag opa",
      type: "birthday",
      date: fridayThisWeek,
      startTime: "16:00",
      endTime: "18:00",
      overrulesRoutine: false,
    },
  });

  // Deliberately clashes with the default Tuesday work block (09:00-15:00) so
  // the conflict-detection feature has a real example to show, matching the
  // spec's own worked example (werk 09:00-12:00 + oudergesprek 10:00).
  const tuesdayThisWeek = addDays(weekStart, 1);
  await prisma.calendarEvent.create({
    data: {
      calendarId: familyCalendar.id,
      title: "Oudergesprek",
      type: "appointment",
      date: tuesdayThisWeek,
      startTime: "10:00",
      endTime: "10:30",
      overrulesRoutine: false,
    },
  });

  // ---------------------------------------------------------------------
  // WORK
  // ---------------------------------------------------------------------
  const normalProfile = await prisma.workProfile.create({
    data: { parentId: parent.id, name: "Normale week", isDefault: true },
  });
  for (const day of [1, 2, 3]) {
    await prisma.workBlock.create({
      data: { workProfileId: normalProfile.id, dayOfWeek: day, startTime: "09:00", endTime: "15:00", label: "Werk" },
    });
  }
  await prisma.workProfile.create({ data: { parentId: parent.id, name: "Launch week", isDefault: false } });
  await prisma.workProfile.create({ data: { parentId: parent.id, name: "Vakantieweek", isDefault: false } });

  // An incidental deviation: a longer work day this Thursday (not in the default profile).
  const thursdayThisWeek = addDays(weekStart, 3);
  await prisma.workBlock.create({
    data: {
      workProfileId: normalProfile.id,
      date: thursdayThisWeek,
      startTime: "09:00",
      endTime: "17:00",
      label: "Langere werkdag",
    },
  });

  // ---------------------------------------------------------------------
  // MATERIALS / INVENTORY
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
  // LEARNING GOAL: jaar -> maand -> week -> activiteiten
  // ---------------------------------------------------------------------
  const goal = await prisma.learningGoal.create({
    data: {
      childId: daughter.id,
      title: "Dit schooljaar leren lezen en schrijven",
      description: "Sofie leert dit schooljaar letters herkennen, woorden lezen en haar eerste woorden schrijven.",
      startDate: schoolYearStart,
      endDate: schoolYearEnd,
      desiredSkillsText: "Letters herkennen, klanken koppelen, korte woorden lezen, eigen naam en korte woorden schrijven.",
      progress: 0,
    },
  });

  const yearSkill = await prisma.learningSkill.create({
    data: {
      goalId: goal.id,
      period: "year",
      title: "Leren lezen en schrijven",
      periodStart: schoolYearStart,
      periodEnd: schoolYearEnd,
    },
  });

  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
  const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);
  const monthSkill = await prisma.learningSkill.create({
    data: {
      goalId: goal.id,
      parentSkillId: yearSkill.id,
      period: "month",
      title: "Letters herkennen",
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
  });

  const weekEnd = addDays(weekStart, 6);
  const weekSkill = await prisma.learningSkill.create({
    data: {
      goalId: goal.id,
      parentSkillId: monthSkill.id,
      period: "week",
      title: "M + S herkennen en M schrijven",
      periodStart: weekStart,
      periodEnd: weekEnd,
    },
  });

  const activityDefs: {
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
        "Laat het kind de M drie keer aanwijzen in het boek.",
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
        "Bij elk getal noemt het kind een woord met M.",
        "Schrijf de gevonden woorden samen op.",
        "Vier het einde van de week met een klein applaus.",
      ],
      materials: ["dobbelsteen"],
      difficulty: "gemiddeld",
    },
  ];

  const activities: { id: string; weekday: number }[] = [];
  for (const a of activityDefs) {
    const activity = await prisma.learningActivity.create({
      data: {
        skillId: weekSkill.id,
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
    activities.push({ id: activity.id, weekday: a.weekday });
  }

  // ---------------------------------------------------------------------
  // LEARNING GOAL #2 (Milo): seizoensgebonden, laat het thema-systeem zien
  // ---------------------------------------------------------------------
  const seasonGoal = await prisma.learningGoal.create({
    data: {
      childId: son.id,
      title: "De seizoenen ontdekken",
      description: "Milo ontdekt dit jaar wat er in elk seizoen verandert in de natuur — te beginnen met de herfst.",
      startDate: schoolYearStart,
      endDate: schoolYearEnd,
      desiredSkillsText: "Kleuren en vormen benoemen, natuurmateriaal herkennen, een kleine knutselopdracht afmaken.",
      progress: 0,
    },
  });
  const seasonYearSkill = await prisma.learningSkill.create({
    data: {
      goalId: seasonGoal.id,
      period: "year",
      title: "De seizoenen ontdekken",
      periodStart: schoolYearStart,
      periodEnd: schoolYearEnd,
    },
  });
  const seasonMonthSkill = await prisma.learningSkill.create({
    data: {
      goalId: seasonGoal.id,
      parentSkillId: seasonYearSkill.id,
      period: "month",
      title: "Herfst ontdekken",
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
  });
  const seasonWeekSkill = await prisma.learningSkill.create({
    data: {
      goalId: seasonGoal.id,
      parentSkillId: seasonMonthSkill.id,
      period: "week",
      title: "Herfstkleuren en -materiaal",
      periodStart: weekStart,
      periodEnd: weekEnd,
    },
  });
  const herfstcollage = await prisma.learningActivity.create({
    data: {
      skillId: seasonWeekSkill.id,
      title: "Herfstcollage maken",
      icon: "🍂",
      ageRangeMin: 2,
      ageRangeMax: 5,
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
      preferredWeekday: 4,
      themeKey: "herfst_nl",
    },
  });
  for (const mName of ["bladeren", "papier", "schaar", "lijm"]) {
    await prisma.learningActivityMaterial.create({
      data: { activityId: herfstcollage.id, materialId: materials[mName].id },
    });
  }

  // ---------------------------------------------------------------------
  // HOUSEHOLD TASKS
  // ---------------------------------------------------------------------
  await prisma.householdTask.create({
    data: {
      familyId: family.id,
      title: "Boodschappen doen",
      icon: "🛒",
      category: "shopping",
      daysOfWeek: j([2]),
      preferredTime: "17:00",
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
      preferredTime: "19:15",
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
      preferredTime: "16:30",
      durationMinutes: 10,
      isRequired: false,
      assignedChildId: daughter.id,
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
      assignedChildId: son.id,
    },
  });

  console.log("Seed complete:");
  console.log(`  Family: ${family.name} (${family.id})`);
  console.log(`  Children: ${daughter.name}, ${son.name}`);
  console.log(`  This week starts: ${iso(weekStart)}`);
  console.log(`  Learning activities seeded for week skill "${weekSkill.title}": ${activities.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
