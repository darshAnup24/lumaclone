import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth }),
}));

import {
  getBrowserUser,
  requestEmailOtp,
  signOut,
  updateUserMetadata,
  verifyEmailOtp,
} from "@/lib/auth/browser";

function createSessionStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
}

describe("browser authentication", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { origin: "https://campus.test" } });
    vi.stubGlobal("sessionStorage", createSessionStorage());
    Object.values(auth).forEach((mock) => mock.mockReset());
  });

  it("requests a normalized email OTP with the server callback URL", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });

    await requestEmailOtp(" Student@College.edu ");

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "student@college.edu",
      options: {
        emailRedirectTo: "https://campus.test/auth/confirm",
        shouldCreateUser: true,
      },
    });
    expect(sessionStorage.getItem("campus-luma-pending-email")).toBe(
      "student@college.edu",
    );
  });

  it("surfaces sign-in errors without storing pending state", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: new Error("rate limited") });

    await expect(requestEmailOtp("student@college.edu")).rejects.toThrow(
      "rate limited",
    );
    expect(sessionStorage.getItem("campus-luma-pending-email")).toBeNull();
  });

  it("verifies an email OTP and clears pending state", async () => {
    sessionStorage.setItem("campus-luma-pending-email", "student@college.edu");
    auth.verifyOtp.mockResolvedValue({
      data: { user: { id: "student-1" } },
      error: null,
    });

    await expect(verifyEmailOtp("123456")).resolves.toEqual({ id: "student-1" });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: "student@college.edu",
      token: "123456",
      type: "email",
    });
    expect(sessionStorage.getItem("campus-luma-pending-email")).toBeNull();
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
