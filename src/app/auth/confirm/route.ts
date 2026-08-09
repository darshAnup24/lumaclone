import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTypes = new Set<EmailOtpType>([
  "email",
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = requestUrl.searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/home";

  if (tokenHash && type && allowedTypes.has(type)) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch {
      // Fall through to the existing sign-in UI with a safe error message.
    }
  }

  const errorUrl = new URL("/signin", requestUrl.origin);
  errorUrl.searchParams.set("error", "Unable to verify the sign-in link.");
  return NextResponse.redirect(errorUrl);
}
