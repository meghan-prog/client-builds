import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/db";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "scan_started",
  "question_answered",
  "scan_completed",
  "result_viewed",
  "lead_submitted",
  "academy_cta_clicked",
  "result_shared",
]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.event !== "string" || !ALLOWED_EVENTS.has(body.event)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  await logEvent(
    body.event,
    typeof body.payload === "object" && body.payload ? body.payload : {},
    typeof body.scanId === "string" ? body.scanId : undefined
  );

  return NextResponse.json({ ok: true });
}
