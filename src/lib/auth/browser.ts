import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const pendingEmailKey = "campus-luma-pending-email";

export async function requestEmailOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/confirm`;
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
  sessionStorage.setItem(pendingEmailKey, normalizedEmail);
}

export function getPendingEmail() {
  return sessionStorage.getItem(pendingEmailKey);
}

export async function verifyEmailOtp(token: string) {
  const email = getPendingEmail();
  if (!email) throw new Error("Your sign-in attempt expired. Please request a new code.");

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) throw error;
  sessionStorage.removeItem(pendingEmailKey);
  return data.user;
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
