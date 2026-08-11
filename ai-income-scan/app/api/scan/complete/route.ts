import { NextRequest, NextResponse } from "next/server";
import { completeScan, logEvent } from "@/lib/db";
import { computeResult } from "@/lib/scoring";
import { questions } from "@/config/questions";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.scanId !== "string" || typeof body.answers !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { scanId, answers } = body as { scanId: string; answers: Record<string, string> };

  const validQuestionIds = new Set(questions.map((q) => q.id));
  const cleanAnswers: Record<string, string> = {};
  for (const [questionId, optionId] of Object.entries(answers)) {
    if (validQuestionIds.has(questionId) && typeof optionId === "string") {
      cleanAnswers[questionId] = optionId;
    }
  }

  const result = computeResult(cleanAnswers);

  await completeScan(scanId, cleanAnswers, result);
  await logEvent(
    "scan_completed",
    { primaryRoute: result.primaryRoute, secondaryRoute: result.secondaryRoute },
    scanId
  );

  return NextResponse.json({ result });
}
