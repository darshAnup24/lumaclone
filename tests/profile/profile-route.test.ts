import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  selectSingle: vi.fn(),
  updateEq: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
    },
    from: mocks.from,
  }),
}));

import { GET, PATCH } from "@/app/api/profile/route";

describe("profile API", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({ single: mocks.selectSingle }),
      }),
      update: () => ({ eq: mocks.updateEq }),
    });
  });

  it("rejects unauthenticated profile reads", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const response = await GET();
    expect(response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns persisted profile and auth metadata", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "student-1",
          user_metadata: {
            username: "asha",
            social: { instagram: "asha.codes" },
          },
        },
      },
    });
    mocks.selectSingle.mockResolvedValue({
      data: {
        id: "student-1",
        email: "asha@college.edu",
        name: "Asha",
        avatar_url: null,
        bio: "Builder",
      },
      error: null,
    });

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      email: "asha@college.edu",
      username: "asha",
      social: { instagram: "asha.codes" },
    });
  });

  it("updates only the authenticated profile and supported metadata", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "student-1", user_metadata: {} } },
    });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.updateUser.mockResolvedValue({ error: null });

    const response = await PATCH(
      new Request("https://leviclub.test/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Asha",
          username: "asha.codes",
          bio: "Campus builder",
          social: {
            instagram: "asha",
            twitter: "",
            youtube: "",
            tiktok: "",
            linkedin: "/in/asha",
          },
          role: "admin",
          id: "spoofed",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateEq).toHaveBeenCalledWith("id", "student-1");
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: {
        full_name: "Asha",
        username: "asha.codes",
        bio: "Campus builder",
        social: expect.objectContaining({ instagram: "asha" }),
      },
    });
  });
});
