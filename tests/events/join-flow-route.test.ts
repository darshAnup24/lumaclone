import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  emailOrganizer: vi.fn(),
  emailParticipant: vi.fn(),
}));

const client = {
  auth: { getUser: mocks.getUser },
  from: mocks.from,
  rpc: mocks.rpc,
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => client,
}));

vi.mock("@/lib/email/notifications", () => ({
  emailOrganizerOfNewRequest: mocks.emailOrganizer,
  emailParticipantOfDecision: mocks.emailParticipant,
}));

import { PATCH } from "@/app/api/event-requests/[id]/route";
import { POST } from "@/app/api/events/[id]/requests/route";

const eventId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const timestamp = "2026-08-20T10:00:00.000+05:30";
const requestRecord = {
  id: requestId,
  event_id: eventId,
  user_id: userId,
  status: "pending",
  requested_at: timestamp,
  responded_at: null,
  created_at: timestamp,
  updated_at: timestamp,
};

function insertionResult(result: { data: unknown; error: unknown }) {
  const chain = {
    insert: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
  };
  chain.insert.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.single.mockResolvedValue(result);
  mocks.from.mockReturnValue(chain);
  return chain;
}

describe("join request route boundary", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.from.mockReset();
    mocks.rpc.mockReset();
    mocks.emailOrganizer.mockReset();
    mocks.emailOrganizer.mockResolvedValue(undefined);
    mocks.emailParticipant.mockReset();
    mocks.emailParticipant.mockResolvedValue(undefined);
  });

  it("binds a new request to the authenticated user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    const chain = insertionResult({ data: requestRecord, error: null });
    const response = await POST(new Request("https://campus.test"), {
      params: Promise.resolve({ id: eventId }),
    });
    expect(response.status).toBe(201);
    expect(chain.insert).toHaveBeenCalledWith({
      event_id: eventId,
      user_id: userId,
      status: "pending",
    });
    expect(mocks.emailOrganizer).toHaveBeenCalledWith(eventId);
  });

  it("rejects unauthenticated and duplicate requests", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(
      POST(new Request("https://campus.test"), {
        params: Promise.resolve({ id: eventId }),
      }),
    ).resolves.toMatchObject({ status: 401 });

    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null });
    insertionResult({
      data: null,
      error: { code: "23505", message: "unique constraint" },
    });
    await expect(
      POST(new Request("https://campus.test"), {
        params: Promise.resolve({ id: eventId }),
      }),
    ).resolves.toMatchObject({ status: 409 });
  });

  it("delegates organizer decisions to the locked database function", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "organizer" } }, error: null });
    mocks.rpc.mockResolvedValue({
      data: { ...requestRecord, status: "accepted", responded_at: timestamp },
      error: null,
    });
    const response = await PATCH(
      new Request("https://campus.test", {
        method: "PATCH",
        body: JSON.stringify({ decision: "accepted" }),
      }),
      { params: Promise.resolve({ id: requestId }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("respond_to_event_request", {
      request_id: requestId,
      decision: "accepted",
    });
    expect(mocks.emailParticipant).toHaveBeenCalledWith(userId, eventId, true);
  });

  it("maps database authorization and capacity enforcement to safe conflicts", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "other-user" } }, error: null });
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "P0001", message: "Only the organizer can respond" },
    });
    const unauthorized = await PATCH(
      new Request("https://campus.test", {
        method: "PATCH",
        body: JSON.stringify({ decision: "rejected" }),
      }),
      { params: Promise.resolve({ id: requestId }) },
    );
    expect(unauthorized.status).toBe(403);

    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "P0001", message: "Event capacity reached" },
    });
    const full = await PATCH(
      new Request("https://campus.test", {
        method: "PATCH",
        body: JSON.stringify({ decision: "accepted" }),
      }),
      { params: Promise.resolve({ id: requestId }) },
    );
    expect(full.status).toBe(409);
  });
});
