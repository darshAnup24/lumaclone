import { describe, expect, it, vi } from "vitest";
import {
  AdminAuthenticationError,
  AdminAuthorizationError,
  requireAdmin,
} from "@/lib/admin/auth";

function client(user: { id: string } | null, role: string | null) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: role ? { role } : null,
      error: role ? null : { message: "not found" },
    }),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockReturnValue(chain),
    chain,
  };
}

describe("server-side administrator authorization", () => {
  it("requires an authenticated session", async () => {
    const supabase = client(null, null);
    await expect(requireAdmin(supabase as never)).rejects.toBeInstanceOf(AdminAuthenticationError);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("requires the database profile role instead of client input", async () => {
    const supabase = client({ id: "student-user" }, "student");
    await expect(requireAdmin(supabase as never)).rejects.toBeInstanceOf(AdminAuthorizationError);
    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(supabase.chain.eq).toHaveBeenCalledWith("id", "student-user");
  });

  it("returns the session user only when the profile role is admin", async () => {
    const supabase = client({ id: "admin-user" }, "admin");
    await expect(requireAdmin(supabase as never)).resolves.toEqual({ id: "admin-user" });
  });
});
