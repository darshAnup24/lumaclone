import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function requestMagicLink(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/confirm?next=/home`;
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
}

export async function signInWithGoogle() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/home`,
    },
  });

  if (error) throw error;
}

export async function getBrowserUser() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function updateUserMetadata(metadata: Record<string, unknown>) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.updateUser({ data: metadata });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
