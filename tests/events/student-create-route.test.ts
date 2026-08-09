import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createStudentEvent: vi.fn(),
}));

const client = { auth: { getUser: mocks.getUser } };

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => client,
}));

vi.mock("@/lib/events/repository", () => ({
  createStudentEvent: mocks.createStudentEvent,
}));

import { POST } from "@/app/api/events/route";

const validBody = {
  title: "DSA Practice",
  description: "Practice graphs together.",
  category: "study",
  content_type: "event",
  start_time: "2026-08-20T12:30:00.000Z",
  end_time: "2026-08-20T13:30:00.000Z",
  timezone: "Asia/Kolkata",
  location_type: "physical",
  location: "Library discussion room",
  capacity: 5,
  requires_approval: true,
};

function request(body: unknown) {
  return new Request("https://campus.test/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("student activity creation endpoint", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.createStudentEvent.mockReset();
  });

  it("rejects unauthenticated creation before writing an event", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(request(validBody));
    expect(response.status).toBe(401);
    expect(mocks.createStudentEvent).not.toHaveBeenCalled();
  });

  it("uses authenticated ownership and strips spoofed institutional fields", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "authenticated-student" } },
      error: null,
    });
    mocks.createStudentEvent.mockResolvedValue({ id: "created-event" });

    const response = await POST(
      request({
        ...validBody,
        organizer_user_id: "spoofed-user",
        event_type: "official",
        source: "admin",
        organization_id: "10000000-0000-4000-8000-000000000001",
        status: "draft",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createStudentEvent).toHaveBeenCalledWith(
      client,
      "authenticated-student",
      expect.objectContaining({ title: "DSA Practice", status: "published" }),
    );
    const input = mocks.createStudentEvent.mock.calls[0][2];
    expect(input).not.toHaveProperty("organizer_user_id");
    expect(input).not.toHaveProperty("event_type");
    expect(input).not.toHaveProperty("source");
    expect(input).not.toHaveProperty("organization_id");
  });

  it("rejects invalid activity data without touching the repository", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "authenticated-student" } },
      error: null,
    });
    const response = await POST(request({ ...validBody, title: "" }));
    expect(response.status).toBe(400);
    expect(mocks.createStudentEvent).not.toHaveBeenCalled();
  });

  it("returns a safe error when the database rejects creation", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "authenticated-student" } },
      error: null,
    });
    mocks.createStudentEvent.mockRejectedValue(new Error("row-level security details"));
    const response = await POST(request(validBody));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "The activity could not be created. Please try again.",
    });
  });
});
