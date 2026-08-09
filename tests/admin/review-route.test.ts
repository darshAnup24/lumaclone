import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  reviewInboundEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ marker: "session-client" }),
}));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthenticationError: class AdminAuthenticationError extends Error {},
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/admin/review", () => ({ reviewInboundEvent: mocks.reviewInboundEvent }));

import { AdminAuthenticationError, AdminAuthorizationError } from "@/lib/admin/auth";
import { PATCH } from "@/app/api/admin/events/[id]/route";

const id = "11111111-1111-4111-8111-111111111111";
const body = {
  action: "publish",
  event: {
    title: "Reviewed event", description: null, category: "other", organization_id: null,
    event_type: "official", content_type: "event", start_time: null, end_time: null,
    timezone: "Asia/Kolkata", location_type: "tbd", location: null, meeting_url: null,
    capacity: null, registration_url: null, registration_deadline: null,
    confidence_score: null, possible_duplicate: false,
  },
};

function request(input: unknown = body) {
  return new Request(`https://campus.test/api/admin/events/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
}

describe("admin review route", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset();
    mocks.reviewInboundEvent.mockReset();
  });

  it("rejects signed-out and non-admin callers before mutation", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new AdminAuthenticationError());
    expect((await PATCH(request(), { params: Promise.resolve({ id }) })).status).toBe(401);
    mocks.requireAdmin.mockRejectedValueOnce(new AdminAuthorizationError());
    expect((await PATCH(request(), { params: Promise.resolve({ id }) })).status).toBe(403);
    expect(mocks.reviewInboundEvent).not.toHaveBeenCalled();
  });

  it("uses the authenticated RLS client for a validated admin publication", async () => {
    mocks.requireAdmin.mockResolvedValue({ id: "admin-user" });
    mocks.reviewInboundEvent.mockResolvedValue({ id, status: "published" });
    const response = await PATCH(request(), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(mocks.requireAdmin).toHaveBeenCalledWith({ marker: "session-client" });
    expect(mocks.reviewInboundEvent).toHaveBeenCalledWith(
      { marker: "session-client" }, id, expect.objectContaining({ action: "publish" }),
    );
  });

  it("does not accept client-supplied ownership, source, status, or publication fields", async () => {
    mocks.requireAdmin.mockResolvedValue({ id: "admin-user" });
    mocks.reviewInboundEvent.mockResolvedValue({ id, status: "published" });
    await PATCH(request({ ...body, event: { ...body.event, source: "student", status: "published", organizer_user_id: "spoofed", published_at: "2020-01-01T00:00:00Z" } }), { params: Promise.resolve({ id }) });
    const parsed = mocks.reviewInboundEvent.mock.calls[0][2];
    expect(parsed.event).not.toHaveProperty("source");
    expect(parsed.event).not.toHaveProperty("status");
    expect(parsed.event).not.toHaveProperty("organizer_user_id");
    expect(parsed.event).not.toHaveProperty("published_at");
  });

  it("blocks publishing an unresolved unknown category", async () => {
    const response = await PATCH(request({ ...body, event: { ...body.event, category: "unknown" } }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(400);
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.reviewInboundEvent).not.toHaveBeenCalled();
  });
});
