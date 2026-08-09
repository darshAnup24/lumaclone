import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./env";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, anonKey } = getPublicSupabaseConfig();
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}
