import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/home";

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch {
      // Fall through to the existing sign-in UI with a safe error message.
    }
  }

  const errorUrl = new URL("/signin", requestUrl.origin);
  errorUrl.searchParams.set("error", "Unable to complete Google sign-in.");
  return NextResponse.redirect(errorUrl);
}
