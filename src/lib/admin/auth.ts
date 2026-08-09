import "server-only";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export class AdminAuthenticationError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AdminAuthenticationError";
  }
}

export class AdminAuthorizationError extends Error {
  constructor() {
    super("Administrator access required");
    this.name = "AdminAuthorizationError";
  }
}

export async function requireAdmin(supabase: ServerSupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new AdminAuthenticationError();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || profile?.role !== "admin") {
    throw new AdminAuthorizationError();
  }
  return user;
}
