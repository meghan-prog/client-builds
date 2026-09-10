import {
  BlockCategory,
  EngineConflict,
  EngineDeviation,
  EngineScheduleBlock,
  EngineUnscheduledItem,
  SchoolEventInput,
  WeekPlanEngineInput,
  WeekPlanEngineResult,
  Weekday,
} from "./types";
import {
  addDaysISO,
  durationMinutes,
  isoWeekday,
  overlaps,
  toHHMM,
  toMinutes,
  weekDates,
} from "./time";

// Categories that represent firm commitments; used for conflict detection and
// deviation "hardness". Lower number = higher priority, matching spec section 22.
const CATEGORY_PRIORITY: Record<BlockCategory, number> = {
  appointment: 1,
  school: 2,
  work: 3,
  routine: 4,
  household: 5,
  learning: 6,
  activity: 7,
  free: 8,
};

// "school" and plain "routine" blocks are deliberately excluded: school is a
// fixed institutional time slot that isn't really competing for anyone's
// calendar, and daily routines are laid out back-to-back by construction.
// Comparing them against "work" would falsely flag a conflict on every single
// school day (parent works while children are at school — by design, not a
// conflict).
const CONFLICT_ELIGIBLE: BlockCategory[] = ["appointment", "work", "household"];

// "work" and "appointment" are always about the parent's calendar, so any two
// of them can genuinely clash regardless of which child (if any) they're
// tagged with. "household" only clashes with another block when they name
// the *same* specific child — a parent's work doesn't block a child from
// doing their own chore.
const PARENT_LEVEL_CATEGORIES = new Set<BlockCategory>(["appointment", "work"]);

const SUPPRESSING_SCHOOL_EVENT_TYPES = new Set([
  "study_day",
  "holiday",
  "free_day",
  "school_trip",
  "school_cancelled",
]);

function mapRoutineCategory(category: string): BlockCategory {
  if (category === "school") return "school";
  if (category === "household") return "household";
  return "routine";
}

function schoolEventIcon(type: SchoolEventInput["type"]): string {
  switch (type) {
    case "study_day":
      return "🏠";
    case "holiday":
      return "🏖️";
    case "school_trip":
      return "🚌";
    case "parent_evening":
      return "🗣️";
    case "free_day":
      return "🌤️";
    case "school_activity":
      return "🎭";
    case "school_cancelled":
      return "🚫";
    default:
      return "🏫";
  }
}

function schoolEventDescription(type: SchoolEventInput["type"]): string {
  switch (type) {
    case "study_day":
      return "Geen school vandaag — studiedag";
    case "holiday":
      return "Schoolvakantie";
    case "school_trip":
      return "Schoolreis, afwijkende tijden mogelijk";
    case "parent_evening":
      return "Oudergesprek op school";
    case "free_day":
      return "Vrije dag";
    case "school_activity":
      return "Schoolactiviteit";
    case "school_cancelled":
      return "Op het laatste moment afgelast";
    default:
      return "";
  }
}

function calendarEventIcon(type: string): string {
  switch (type) {
    case "birthday":
      return "🎂";
    case "visit":
      return "🏡";
    case "trip":
      return "🌍";
    case "appointment":
      return "📌";
    default:
      return "📍";
  }
}

function datesBetween(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let cur = startISO;
  let guard = 0;
  while (cur <= endISO && guard < 400) {
    out.push(cur);
    cur = addDaysISO(cur, 1);
    guard++;
  }
  return out;
}

function pushDeviation(list: EngineDeviation[], dev: EngineDeviation) {
  const exists = list.some((d) => d.date === dev.date && d.title === dev.title);
  if (!exists) list.push(dev);
}

/**
 * Pure function: base routines + variable inputs + intentions -> a full week
 * plan. No I/O, no persistence — the data layer owns turning this into
 * database rows.
 */
export function generateWeekPlan(input: WeekPlanEngineInput): WeekPlanEngineResult {
  const dates = weekDates(input.weekStartDate);
  const blocks: EngineScheduleBlock[] = [];
  const deviations: EngineDeviation[] = [];
  const unscheduled: EngineUnscheduledItem[] = [];

  const schoolEventsByDate = new Map<string, SchoolEventInput[]>();
  for (const ev of input.schoolEvents) {
    for (const d of datesBetween(ev.startDate, ev.endDate)) {
      if (!dates.includes(d)) continue;
      if (!schoolEventsByDate.has(d)) schoolEventsByDate.set(d, []);
      schoolEventsByDate.get(d)!.push(ev);
    }
  }

  for (const date of dates) {
    const weekday = isoWeekday(date) as Weekday;
    const eventsToday = schoolEventsByDate.get(date) ?? [];

    // 1. BASE routines (suppressed by overruling school events where relevant)
    for (const r of input.routines) {
      if (!r.daysOfWeek.includes(weekday)) continue;
      const applicableChildren = r.childIds.length ? r.childIds : input.children.map((c) => c.id);

      if (r.category === "school") {
        const suppressed = eventsToday.some(
          (e) =>
            SUPPRESSING_SCHOOL_EVENT_TYPES.has(e.type) &&
            (e.childId === null || applicableChildren.includes(e.childId))
        );
        if (suppressed) continue;
      }

      blocks.push({
        date,
        startTime: r.startTime,
        endTime: r.endTime,
        category: r.isFreeSpaceBlock ? "free" : mapRoutineCategory(r.category),
        title: r.title,
        icon: r.icon,
        childId: r.childIds.length === 1 ? r.childIds[0] : null,
        sourceType: "routine",
        sourceId: r.id,
        isFreeSpace: r.isFreeSpaceBlock,
        hasConflict: false,
        isDeviation: false,
      });
    }

    // 2. School events as their own visible blocks + deviations
    for (const e of eventsToday) {
      if (e.type === "school_day") continue;
      const icon = schoolEventIcon(e.type);
      blocks.push({
        date,
        startTime: e.startTime ?? "09:00",
        endTime: e.endTime ?? "15:00",
        category: "school",
        title: e.title,
        icon,
        childId: e.childId,
        sourceType: "school_event",
        sourceId: e.id,
        isFreeSpace: false,
        hasConflict: false,
        isDeviation: true,
      });
      pushDeviation(deviations, { date, icon, title: e.title, description: schoolEventDescription(e.type) });
    }

    // 3. Calendar events (appointments / visits / birthdays)
    for (const ce of input.calendarEvents.filter((c) => c.date === date)) {
      const icon = ce.icon ?? calendarEventIcon(ce.type);
      const start = ce.startTime ?? "09:00";
      const end = ce.endTime ?? toHHMM(toMinutes(start) + 30);
      blocks.push({
        date,
        startTime: start,
        endTime: end,
        category: "appointment",
        title: ce.title,
        icon,
        childId: null,
        sourceType: "calendar_event",
        sourceId: ce.id,
        isFreeSpace: false,
        hasConflict: false,
        isDeviation: true,
      });
      pushDeviation(deviations, { date, icon, title: ce.title });
    }

    // 4. Work blocks (resolved to concrete dates by the data layer)
    for (const wb of input.workBlocks.filter((w) => w.date === date)) {
      blocks.push({
        date,
        startTime: wb.startTime,
        endTime: wb.endTime,
        category: "work",
        title: `${wb.label} — ${wb.parentName}`,
        icon: "💻",
        childId: null,
        sourceType: "work_block",
        sourceId: wb.id,
        isFreeSpace: false,
        hasConflict: false,
        isDeviation: !wb.isDefault,
      });
      if (!wb.isDefault) {
        pushDeviation(deviations, {
          date,
          icon: "💻",
          title: wb.label,
          description: `Afwijkend werkblok (${wb.parentName})`,
        });
      }
    }

    // 5. Necessary household tasks
    for (const ht of input.householdTasks.filter((t) => t.daysOfWeek.includes(weekday))) {
      const start = ht.preferredTime;
      const end = toHHMM(toMinutes(start) + ht.durationMinutes);
      blocks.push({
        date,
        startTime: start,
        endTime: end,
        category: "household",
        title: ht.title,
        icon: ht.icon,
        childId: ht.assignedChildId ?? null,
        sourceType: "household_task",
        sourceId: ht.id,
        isFreeSpace: false,
        hasConflict: false,
        isDeviation: false,
      });
    }

    // 6. Intentions with an explicit hard time become fixed appointments
    for (const item of input.intentionItems.filter((i) => i.date === date)) {
      if (item.kind === "hard_appointment" || item.startTime) {
        const start = item.startTime ?? "09:00";
        const end = item.endTime ?? toHHMM(toMinutes(start) + (item.durationMinutes ?? 30));
        blocks.push({
          date,
          startTime: start,
          endTime: end,
          category: item.kind === "household" ? "household" : "appointment",
          title: item.title,
          icon: item.icon,
          childId: item.childId ?? null,
          sourceType: "intention",
          sourceId: item.id,
          isFreeSpace: false,
          hasConflict: false,
          isDeviation: true,
        });
        pushDeviation(deviations, { date, icon: item.icon, title: item.title });
      }
    }
  }

  // 7. Fill protected free-space blocks with learning activities and
  //    flexible (no fixed time) intention activities, without ever eating
  //    into the protected fraction of the block.
  const freeBlocksByDate = new Map<string, EngineScheduleBlock[]>();
  for (const b of blocks) {
    if (b.isFreeSpace) {
      if (!freeBlocksByDate.has(b.date)) freeBlocksByDate.set(b.date, []);
      freeBlocksByDate.get(b.date)!.push(b);
    }
  }

  const remainingCandidates = input.learningCandidates.map((c) => ({ ...c }));
  const placedLearningToday = new Set<string>(); // `${childId}|${date}`

  interface FreeSlotState {
    date: string;
    weekday: Weekday;
    block: EngineScheduleBlock;
    capMinutes: number;
    protectedMinutes: number;
    used: number;
    cursor: number;
  }

  const slots: FreeSlotState[] = [];
  for (const date of dates) {
    const weekday = isoWeekday(date) as Weekday;
    for (const fb of freeBlocksByDate.get(date) ?? []) {
      const capMinutes = durationMinutes(fb.startTime, fb.endTime);
      slots.push({
        date,
        weekday,
        block: fb,
        capMinutes,
        protectedMinutes: Math.round(capMinutes * input.freeSpaceProtectionRatio),
        used: 0,
        cursor: toMinutes(fb.startTime),
      });
    }
  }

  const placeInSlot = (
    slot: FreeSlotState,
    dur: number,
    build: (start: string, end: string) => EngineScheduleBlock
  ): boolean => {
    if (slot.used + dur > slot.capMinutes - slot.protectedMinutes) return false;
    const start = toHHMM(slot.cursor);
    const end = toHHMM(slot.cursor + dur);
    blocks.push(build(start, end));
    slot.cursor += dur;
    slot.used += dur;
    return true;
  };

  // Pass 1: flexible (undated-time) intentions the parent asked for on a specific day.
  for (const slot of slots) {
    const flexToday = input.intentionItems.filter(
      (i) => i.date === slot.date && i.kind === "flexible_activity" && !i.startTime
    );
    for (const item of flexToday) {
      const dur = item.durationMinutes ?? 45;
      const placed = placeInSlot(slot, dur, (start, end) => ({
        date: slot.date,
        startTime: start,
        endTime: end,
        category: "activity",
        title: item.title,
        icon: item.icon,
        childId: item.childId ?? null,
        sourceType: "intention",
        sourceId: item.id,
        isFreeSpace: false,
        hasConflict: false,
        isDeviation: true,
      }));
      if (placed) {
        pushDeviation(deviations, { date: slot.date, icon: item.icon, title: item.title });
      } else {
        unscheduled.push({
          title: item.title,
          reason: "Geen ruimte meer in het middagblok deze dag",
          sourceType: "intention",
          sourceId: item.id,
        });
      }
    }
  }

  // Pass 2: learning activities on their preferred weekday from the week-goal breakdown.
  for (const slot of slots) {
    for (const cand of remainingCandidates) {
      if (cand.timesNeeded <= 0) continue;
      if (cand.preferredWeekday && cand.preferredWeekday !== slot.weekday) continue;
      const key = `${cand.childId}|${slot.date}`;
      if (placedLearningToday.has(key)) continue;
      const placed = placeInSlot(slot, cand.durationMinutes, (start, end) => ({
        date: slot.date,
        startTime: start,
        endTime: end,
        category: "learning",
        title: cand.title,
        icon: cand.icon,
        childId: cand.childId,
        sourceType: "scheduled_activity",
        sourceId: cand.id,
        isFreeSpace: false,
        hasConflict: false,
        isDeviation: false,
      }));
      if (placed) {
        cand.timesNeeded -= 1;
        placedLearningToday.add(key);
      }
    }
  }

  // Pass 3: any learning activity that didn't fit its preferred day gets moved
  // flexibly to the next day with room — "leeractiviteiten moeten flexibel
  // kunnen worden verplaatst binnen geschikte middagblokken".
  for (const slot of slots) {
    for (const cand of remainingCandidates) {
      if (cand.timesNeeded <= 0) continue;
      const key = `${cand.childId}|${slot.date}`;
      if (placedLearningToday.has(key)) continue;
      const placed = placeInSlot(slot, cand.durationMinutes, (start, end) => ({
        date: slot.date,
        startTime: start,
        endTime: end,
        category: "learning",
        title: cand.title,
        icon: cand.icon,
        childId: cand.childId,
        sourceType: "scheduled_activity",
        sourceId: cand.id,
        isFreeSpace: false,
        hasConflict: false,
        isDeviation: false,
      }));
      if (placed) {
        cand.timesNeeded -= 1;
        placedLearningToday.add(key);
      }
    }
  }

  for (const cand of remainingCandidates) {
    if (cand.timesNeeded > 0) {
      unscheduled.push({
        title: `${cand.title} (${cand.skillTitle})`,
        reason: "Geen geschikt middagblok gevonden deze week",
        sourceType: "scheduled_activity",
        sourceId: cand.id,
      });
    }
  }

  // 8. Conflict detection among firm-commitment categories
  const conflicts: EngineConflict[] = [];
  for (const date of dates) {
    const hardBlocks = blocks.filter((b) => b.date === date && CONFLICT_ELIGIBLE.includes(b.category));
    for (let i = 0; i < hardBlocks.length; i++) {
      for (let j = i + 1; j < hardBlocks.length; j++) {
        const a = hardBlocks[i];
        const b = hardBlocks[j];
        const bothParentLevel = PARENT_LEVEL_CATEGORIES.has(a.category) && PARENT_LEVEL_CATEGORIES.has(b.category);
        const sameSpecificChild = a.childId !== null && a.childId === b.childId;
        if (!bothParentLevel && !sameSpecificChild) continue;
        if (!overlaps(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

        a.hasConflict = true;
        b.hasConflict = true;

        const [high, low] =
          CATEGORY_PRIORITY[a.category] <= CATEGORY_PRIORITY[b.category] ? [a, b] : [b, a];

        let suggestion: EngineConflict["suggestion"] = null;
        if (toMinutes(low.startTime) <= toMinutes(high.startTime) && toMinutes(high.endTime) <= toMinutes(low.endTime)) {
          const segments = [
            { title: low.title, startTime: low.startTime, endTime: high.startTime },
            { title: high.title, startTime: high.startTime, endTime: high.endTime },
            { title: low.title, startTime: high.endTime, endTime: low.endTime },
          ].filter((s) => toMinutes(s.startTime) < toMinutes(s.endTime));
          suggestion = {
            description: `Splits "${low.title}" rond "${high.title}"`,
            segments,
          };
        } else {
          suggestion = {
            description: `Pas de tijd van "${low.title}" of "${high.title}" aan zodat ze niet overlappen`,
            segments: [],
          };
        }

        conflicts.push({
          date,
          description: `${a.title} (${a.startTime}-${a.endTime}) overlapt met ${b.title} (${b.startTime}-${b.endTime})`,
          blockATitle: a.title,
          blockBTitle: b.title,
          suggestion,
        });
      }
    }
  }

  return { blocks, conflicts, deviations, unscheduled };
}
