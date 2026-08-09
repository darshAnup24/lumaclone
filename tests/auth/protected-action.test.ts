import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser },
  }),
}));

import { POST } from "@/app/api/user/upload-image/route";

describe("protected user actions", () => {
  beforeEach(() => getUser.mockReset());

  it("rejects an unauthenticated image upload before reading the body", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await POST(
      new Request("https://campus.test/api/user/upload-image", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "User not authorized",
    });
  });
});
