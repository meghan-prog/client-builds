"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getPrimaryFamilyId } from "@/lib/data/family";
import { generateAndPersistWeekPlan, saveWeeklyIntention } from "@/lib/data/planning";
import { setScheduledActivityStatus } from "@/lib/data/learning";
import {
  addManualShoppingItem,
  toggleHouseholdTaskCompletion,
  toggleShoppingItem,
} from "@/lib/data/shopping-tasks";
import { reportSchoolCancellation, uploadAndParseSchoolCalendar } from "@/lib/data/school";
import { toggleRoutineCompletion } from "@/lib/data/kids";
import { createWorkProfile, setDefaultWorkProfile } from "@/lib/data/settings";
import { applyAgentAction, dismissAgentAction, sendUserMessage } from "@/lib/data/agent";
import type { DocumentParseInput } from "@/lib/ai/document-parser";

export async function regenerateWeekPlanAction(weekStart: string) {
  const familyId = await getPrimaryFamilyId();
  await generateAndPersistWeekPlan(familyId, weekStart);
  revalidatePath(`/week/${weekStart}`);
}

export async function acceptConflictAction(conflictId: string, weekStart: string) {
  const conflict = await prisma.conflict.findUniqueOrThrow({ where: { id: conflictId } });
  if (conflict.suggestion) {
    const suggestion = JSON.parse(conflict.suggestion) as {
      segments: { title: string; startTime: string; endTime: string }[];
    };
    if (suggestion.segments.length === 3) {
      const [seg1, seg2, seg3] = suggestion.segments;
      const lowBlock = await prisma.scheduleBlock.findFirst({
        where: { weekPlanId: conflict.weekPlanId, date: conflict.date, title: seg1.title, hasConflict: true },
      });
      const highBlock = await prisma.scheduleBlock.findFirst({
        where: { weekPlanId: conflict.weekPlanId, date: conflict.date, title: seg2.title, hasConflict: true },
      });
      if (lowBlock) {
        await prisma.scheduleBlock.update({
          where: { id: lowBlock.id },
          data: { startTime: seg1.startTime, endTime: seg1.endTime, hasConflict: false },
        });
        await prisma.scheduleBlock.create({
          data: {
            weekPlanId: lowBlock.weekPlanId,
            familyId: lowBlock.familyId,
            date: lowBlock.date,
            startTime: seg3.startTime,
            endTime: seg3.endTime,
            category: lowBlock.category,
            title: lowBlock.title,
            icon: lowBlock.icon,
            childId: lowBlock.childId,
            sourceType: lowBlock.sourceType,
            sourceId: lowBlock.sourceId,
            isFreeSpace: false,
            hasConflict: false,
            isDeviation: lowBlock.isDeviation,
          },
        });
      }
      if (highBlock) {
        await prisma.scheduleBlock.update({ where: { id: highBlock.id }, data: { hasConflict: false } });
      }
    }
  }
  await prisma.conflict.update({ where: { id: conflictId }, data: { status: "accepted" } });
  revalidatePath(`/week/${weekStart}`);
}

export async function dismissConflictAction(conflictId: string, weekStart: string) {
  await prisma.conflict.update({ where: { id: conflictId }, data: { status: "dismissed" } });
  revalidatePath(`/week/${weekStart}`);
}

export async function saveIntentionAction(weekStart: string, rawText: string) {
  const familyId = await getPrimaryFamilyId();
  await saveWeeklyIntention(familyId, weekStart, rawText);
  await generateAndPersistWeekPlan(familyId, weekStart);
  revalidatePath(`/week/${weekStart}`);
}

export async function completeActivityAction(scheduledActivityId: string, done: boolean, weekStart?: string) {
  await setScheduledActivityStatus(scheduledActivityId, done);
  revalidatePath("/learning");
  revalidatePath("/children");
  if (weekStart) revalidatePath(`/week/${weekStart}`);
  revalidatePath(`/activity/${scheduledActivityId}`);
}

export async function toggleHouseholdTaskAction(taskId: string, dateISO: string, childId?: string | null) {
  await toggleHouseholdTaskCompletion(taskId, dateISO, childId);
  revalidatePath("/tasks");
  revalidatePath("/kids");
  if (childId) revalidatePath(`/kids/${childId}`);
}

export async function toggleRoutineAction(routineId: string, childId: string, dateISO: string) {
  await toggleRoutineCompletion(routineId, childId, dateISO);
  revalidatePath(`/kids/${childId}`);
}

export async function toggleShoppingItemAction(id: string) {
  await toggleShoppingItem(id);
  revalidatePath("/shopping");
}

export async function addShoppingItemAction(name: string) {
  const familyId = await getPrimaryFamilyId();
  if (name.trim().length === 0) return;
  await addManualShoppingItem(familyId, name.trim());
  revalidatePath("/shopping");
}

export async function sendAgentMessageAction(text: string) {
  const familyId = await getPrimaryFamilyId();
  await sendUserMessage(familyId, text);
  revalidatePath("/assistant");
}

export async function applyAgentActionAction(messageId: string) {
  const result = await applyAgentAction(messageId);
  revalidatePath("/assistant");
  if (result.applied && "weekStart" in result) {
    revalidatePath(`/week/${result.weekStart}`);
    revalidatePath("/learning");
  }
  return result;
}

export async function dismissAgentActionAction(messageId: string) {
  await dismissAgentAction(messageId);
  revalidatePath("/assistant");
}

export async function reportSchoolCancellationAction(dateISO: string, childId: string | null, reason: string) {
  const familyId = await getPrimaryFamilyId();
  const { weekStart } = await reportSchoolCancellation(familyId, dateISO, childId, reason || undefined);
  revalidatePath(`/week/${weekStart}`);
  revalidatePath(`/week/${weekStart}/${dateISO}`);
  revalidatePath("/school");
  return { weekStart };
}

export async function createWorkProfileAction(parentId: string, name: string) {
  if (name.trim().length === 0) return;
  await createWorkProfile(parentId, name.trim());
  revalidatePath("/settings");
}

export async function setDefaultWorkProfileAction(parentId: string, workProfileId: string) {
  await setDefaultWorkProfile(parentId, workProfileId);
  revalidatePath("/settings");
}

export async function uploadSchoolCalendarAction(schoolYearId: string, fileName: string, fileType: string) {
  const familyId = await getPrimaryFamilyId();
  const result = await uploadAndParseSchoolCalendar(
    familyId,
    schoolYearId,
    fileName,
    fileType as DocumentParseInput["fileType"]
  );
  revalidatePath("/school");
  return { count: result.events.length, notes: result.notes };
}
