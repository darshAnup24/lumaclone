import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./env";

export function createSupabaseAdminClient() {
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
