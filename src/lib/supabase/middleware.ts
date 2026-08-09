import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfig, isSupabaseConfigured } from "./env";

const protectedPrefixes = [
  "/home",
  "/create",
  "/settings",
  "/profile",
  "/finish-signup",
  "/calendars",
  "/discover",
  "/events",
  "/admin",
];

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function signInRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return isProtectedPath(request.nextUrl.pathname)
      ? signInRedirect(request)
      : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getPublicSupabaseConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (isProtectedPath(pathname) && !user) {
    return signInRedirect(request);
  }

  if (pathname === "/signin" && user) {
    const url = request.nextUrl.clone();
    const requestedNext = request.nextUrl.searchParams.get("next");
    url.pathname =
      requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
