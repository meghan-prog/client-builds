import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createScan, logEvent } from "@/lib/db";

export async function POST() {
  const scanId = randomUUID();

  await createScan(scanId);
  await logEvent("scan_started", {}, scanId);

  return NextResponse.json({ scanId });
}
