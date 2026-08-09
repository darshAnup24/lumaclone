import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  signInWithOAuth: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth }),
}));

import {
  getBrowserUser,
  requestMagicLink,
  signInWithGoogle,
  signOut,
  updateUserMetadata,
} from "@/lib/auth/browser";

describe("browser authentication", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { origin: "https://campus.test" } });
    Object.values(auth).forEach((mock) => mock.mockReset());
  });

  it("requests a normalized email magic link with the server callback URL", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });

    await requestMagicLink(" Student@College.edu ");

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "student@college.edu",
      options: {
        emailRedirectTo: "https://campus.test/auth/confirm?next=/home",
        shouldCreateUser: true,
      },
    });
  });

  it("surfaces magic-link sign-in errors", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: new Error("rate limited") });

    await expect(requestMagicLink("student@college.edu")).rejects.toThrow(
      "rate limited",
    );
  });

  it("starts Google OAuth with the server callback URL", async () => {
    auth.signInWithOAuth.mockResolvedValue({ error: null });

    await signInWithGoogle();

    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://campus.test/auth/callback?next=/home",
      },
    });
  });

  it("restores the authenticated user and updates metadata", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "student-1" } }, error: null });
    auth.updateUser.mockResolvedValue({ data: { user: { id: "student-1" } }, error: null });

    await expect(getBrowserUser()).resolves.toEqual({ id: "student-1" });
    await expect(updateUserMetadata({ username: "Asha" })).resolves.toEqual({
      id: "student-1",
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ data: { username: "Asha" } });
  });

  it("delegates logout and propagates provider errors", async () => {
    auth.signOut.mockResolvedValueOnce({ error: null });
    await expect(signOut()).resolves.toBeUndefined();

    auth.signOut.mockResolvedValueOnce({ error: new Error("logout failed") });
    await expect(signOut()).rejects.toThrow("logout failed");
  });
});
