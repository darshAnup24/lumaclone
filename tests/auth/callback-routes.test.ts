import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth }),
}));

import { GET as confirmEmail } from "@/app/auth/confirm/route";
import { GET as completeGoogle } from "@/app/auth/callback/route";

describe("Supabase auth callbacks", () => {
  beforeEach(() => {
    auth.exchangeCodeForSession.mockReset();
    auth.verifyOtp.mockReset();
  });

  it("exchanges a PKCE code from an email magic link and redirects home", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await confirmEmail(
      new Request("https://campus.test/auth/confirm?code=email-code&next=/home"),
    );

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("email-code");
    expect(response.headers.get("location")).toBe("https://campus.test/home");
  });

  it("continues to support token-hash magic-link templates", async () => {
    auth.verifyOtp.mockResolvedValue({ error: null });

    const response = await confirmEmail(
      new Request(
        "https://campus.test/auth/confirm?token_hash=token-hash&type=magiclink",
      ),
    );

    expect(auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "token-hash",
      type: "magiclink",
    });
    expect(response.headers.get("location")).toBe("https://campus.test/home");
  });

  it("exchanges a Google OAuth code and rejects unsafe next URLs", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await completeGoogle(
      new Request(
        "https://campus.test/auth/callback?code=google-code&next=//attacker.test",
      ),
    );

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("google-code");
    expect(response.headers.get("location")).toBe("https://campus.test/home");
  });

  it("returns safe sign-in errors when a callback cannot be verified", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: new Error("bad code") });

    const response = await completeGoogle(
      new Request("https://campus.test/auth/callback?code=expired"),
    );

    expect(response.headers.get("location")).toBe(
      "https://campus.test/signin?error=Unable+to+complete+Google+sign-in.",
    );
  });
});
