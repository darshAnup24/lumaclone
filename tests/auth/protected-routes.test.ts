import { describe, expect, it } from "vitest";
import { isProtectedPath } from "@/lib/supabase/middleware";

describe("protected route policy", () => {
  it.each([
    "/home",
    "/home/upcoming",
    "/create",
    "/settings",
    "/settings/account",
    "/profile",
    "/finish-signup",
    "/calendars",
    "/discover",
    "/events/11111111-1111-4111-8111-111111111111",
    "/admin/review",
    "/admin/anything",
  ])("protects %s", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(true);
  });

  it.each(["/", "/signin", "/auth/confirm", "/auth/callback"])(
    "keeps %s public",
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(false);
    },
  );
});
