import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let attempted = false;

/**
 * Server-only Supabase client. Returns null when env vars ontbreken, zodat
 * de rest van de app gewoon blijft werken zonder database (lokale dev /
 * nog niet geconfigureerd) in plaats van te crashen.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (attempted) return client;
  attempted = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  return client;
}

export function isDbConfigured(): boolean {
  return getSupabaseServerClient() !== null;
}
