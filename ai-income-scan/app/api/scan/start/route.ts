import { NextResponse } from "next/server";
import { createScan, logEvent } from "@/lib/db";

export async function POST() {
  const scanId = crypto.randomUUID();

  await createScan(scanId);
  await logEvent("scan_started", {}, scanId);

  return NextResponse.json({ scanId });
}
