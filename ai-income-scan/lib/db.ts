import { getSupabaseServerClient, isDbConfigured } from "@/lib/supabase";
import { RouteId, routeList } from "@/config/routes";
import { Answers, ScanResult } from "@/lib/scoring";

export { isDbConfigured };

export async function createScan(scanId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from("scans").insert({
    id: scanId,
    created_at: new Date().toISOString(),
  });
  if (error) console.error("[db] createScan failed", error.message);
}

export async function completeScan(
  scanId: string,
  answers: Answers,
  result: ScanResult
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("scans")
    .upsert({
      id: scanId,
      completed_at: new Date().toISOString(),
      answers,
      scores: result.scores,
      primary_route: result.primaryRoute,
      secondary_route: result.secondaryRoute,
    });
  if (error) console.error("[db] completeScan failed", error.message);
}

export async function saveLead(
  scanId: string,
  firstName: string,
  email: string
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from("leads").insert({
    scan_id: scanId,
    first_name: firstName,
    email,
    created_at: new Date().toISOString(),
  });
  if (error) console.error("[db] saveLead failed", error.message);
}

export async function logEvent(
  eventName: string,
  payload: Record<string, unknown> = {},
  scanId?: string
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from("events").insert({
    scan_id: scanId ?? null,
    event_name: eventName,
    payload,
    created_at: new Date().toISOString(),
  });
  if (error) console.error("[db] logEvent failed", error.message);
}

export async function getScan(scanId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("id", scanId)
    .maybeSingle();

  if (error) {
    console.error("[db] getScan failed", error.message);
    return null;
  }
  return data;
}

export interface AdminStats {
  scansStarted: number;
  scansCompleted: number;
  routeDistribution: { route: RouteId; count: number; percentage: number }[];
  leads: number;
  academyClicks: number;
  conversionScanToLead: number;
  conversionScanToAcademy: number;
}

export async function getStats(): Promise<AdminStats | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const [scansRes, leadsRes, eventsRes] = await Promise.all([
    supabase.from("scans").select("id, completed_at, primary_route"),
    supabase.from("leads").select("id"),
    supabase.from("events").select("event_name").eq("event_name", "academy_cta_clicked"),
  ]);

  const scans = scansRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const academyEvents = eventsRes.data ?? [];

  const scansStarted = scans.length;
  const completedScans = scans.filter((s) => s.completed_at);
  const scansCompleted = completedScans.length;

  const counts: Record<string, number> = {};
  for (const route of routeList) counts[route.id] = 0;
  for (const scan of completedScans) {
    if (scan.primary_route && counts[scan.primary_route] !== undefined) {
      counts[scan.primary_route] += 1;
    }
  }

  const routeDistribution = routeList.map((route) => ({
    route: route.id,
    count: counts[route.id],
    percentage:
      scansCompleted > 0
        ? Math.round((counts[route.id] / scansCompleted) * 100)
        : 0,
  }));

  const leadsCount = leads.length;
  const academyClicks = academyEvents.length;

  return {
    scansStarted,
    scansCompleted,
    routeDistribution,
    leads: leadsCount,
    academyClicks,
    conversionScanToLead:
      scansStarted > 0 ? Math.round((leadsCount / scansStarted) * 100) : 0,
    conversionScanToAcademy:
      scansStarted > 0 ? Math.round((academyClicks / scansStarted) * 100) : 0,
  };
}
