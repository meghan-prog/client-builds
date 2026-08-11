import { NextRequest, NextResponse } from "next/server";
import { saveLead, logEvent } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.scanId !== "string") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!firstName || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_lead" }, { status: 400 });
  }

  await saveLead(body.scanId, firstName, email);
  await logEvent("lead_submitted", {}, body.scanId);

  return NextResponse.json({ ok: true });
}
