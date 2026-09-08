// Planning engine domain types.
//
// This module has ZERO dependency on Prisma, Next.js, or any UI code — it is
// pure domain logic. The data layer (src/lib/data/*) is responsible for
// translating database rows into these plain input types, calling
// `generateWeekPlan`, and persisting the result. That keeps the engine
// testable in isolation and swappable without touching UI components.

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // ISO: 1 = Monday .. 7 = Sunday

export type BlockCategory =
  | "school"
  | "work"
  | "routine"
  | "household"
  | "learning"
  | "activity"
  | "free"
  | "appointment";

export type SourceType =
  | "routine"
  | "school_event"
  | "work_block"
  | "calendar_event"
  | "scheduled_activity"
  | "household_task"
  | "intention"
  | "free_space";

export interface RoutineInput {
  id: string;
  title: string;
  category: string;
  icon: string;
  startTime: string; // "HH:mm"
  endTime: string;
  daysOfWeek: Weekday[];
  childIds: string[]; // empty = applies to whole family
  isFreeSpaceBlock: boolean;
}

export interface SchoolEventInput {
  id: string;
  childId: string | null; // null = applies to all children
  type:
    | "school_day"
    | "study_day"
    | "holiday"
    | "school_trip"
    | "parent_evening"
    | "free_day"
    | "school_activity";
  title: string;
  startDate: string; // ISO date, yyyy-MM-dd
  endDate: string;
  startTime?: string;
  endTime?: string;
}

export interface CalendarEventInput {
  id: string;
  title: string;
  type: "appointment" | "visit" | "birthday" | "trip" | "other";
  date: string; // ISO date
  startTime?: string;
  endTime?: string;
  icon?: string;
}

export interface WorkBlockInstanceInput {
  id: string;
  parentName: string;
  date: string; // ISO date, already resolved to a concrete date
  startTime: string;
  endTime: string;
  label: string;
  isDefault: boolean; // false => deviates from the parent's default profile => surfaces as a deviation
}

export interface HouseholdTaskInput {
  id: string;
  title: string;
  icon: string;
  daysOfWeek: Weekday[];
  preferredTime: string;
  durationMinutes: number;
  isRequired: boolean;
  assignedChildId?: string | null;
}

export interface LearningActivityCandidateInput {
  id: string;
  childId: string;
  title: string;
  icon: string;
  durationMinutes: number;
  skillTitle: string;
  goalTitle: string;
  goalId: string;
  skillId: string;
  /** how many times this candidate still needs to be scheduled this week */
  timesNeeded: number;
  /** preferred weekday from the week-goal breakdown; falls back to any day with room if unavailable */
  preferredWeekday?: Weekday;
}

export interface FlexibleIntentionItem {
  id: string;
  title: string;
  icon: string;
  date: string; // ISO date the parent asked for
  childId?: string | null;
  kind: "flexible_activity" | "hard_appointment" | "household" | "learning_focus";
  startTime?: string; // set when the parent gave a specific time
  endTime?: string;
  durationMinutes?: number;
}

export interface ChildInput {
  id: string;
  name: string;
}

export interface WeekPlanEngineInput {
  familyId: string;
  weekStartDate: string; // Monday, ISO date
  children: ChildInput[];
  routines: RoutineInput[];
  schoolEvents: SchoolEventInput[];
  calendarEvents: CalendarEventInput[];
  workBlocks: WorkBlockInstanceInput[];
  householdTasks: HouseholdTaskInput[];
  learningCandidates: LearningActivityCandidateInput[];
  intentionItems: FlexibleIntentionItem[];
  /** fraction of each free-space block (0..1) that must stay unscheduled */
  freeSpaceProtectionRatio: number;
}

export interface EngineScheduleBlock {
  date: string; // ISO date
  startTime: string;
  endTime: string;
  category: BlockCategory;
  title: string;
  icon: string;
  childId: string | null;
  sourceType: SourceType;
  sourceId: string | null;
  isFreeSpace: boolean;
  hasConflict: boolean;
  isDeviation: boolean;
}

export interface EngineConflict {
  date: string;
  description: string;
  blockATitle: string;
  blockBTitle: string;
  suggestion: {
    description: string;
    segments: { title: string; startTime: string; endTime: string }[];
  } | null;
}

export interface EngineDeviation {
  date: string;
  icon: string;
  title: string;
  description?: string;
}

export interface EngineUnscheduledItem {
  title: string;
  reason: string;
  sourceType: SourceType;
  sourceId: string | null;
}

export interface WeekPlanEngineResult {
  blocks: EngineScheduleBlock[];
  conflicts: EngineConflict[];
  deviations: EngineDeviation[];
  unscheduled: EngineUnscheduledItem[];
}
