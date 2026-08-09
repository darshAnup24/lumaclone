import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { eventRecordSchema, studentEventInputSchema } from "@/lib/events/schema";
import {
  createStudentEvent,
  deleteOwnedStudentEvent,
  getEvent,
  listPublishedEvents,
  updateOwnedStudentEvent,
} from "@/lib/events/repository";

const now = "2026-08-20T10:00:00.000+05:30";
const baseRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Campus Opportunity",
  description: null,
  event_type: "official",
  source: "admin",
  content_type: "opportunity",
  category: "career_placement",
  organizer_user_id: null,
  organization_id: "22222222-2222-4222-8222-222222222222",
  inbound_email_id: null,
  source_email: "placement@college.edu",
  start_time: null,
  end_time: null,
  timezone: "Asia/Kolkata",
  location_type: "tbd",
  location: null,
  meeting_url: null,
  capacity: null,
  registration_url: null,
  registration_deadline: now,
  cover_image_url: null,
  status: "published",
  requires_approval: false,
  confidence_score: null,
  possible_duplicate: false,
  proposed_update_for_event_id: null,
  created_at: now,
  updated_at: now,
  published_at: now,
} as const;

function clientReturning(data: unknown) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.order.mockResolvedValue({ data, error: null });
  chain.maybeSingle.mockResolvedValue({ data, error: null });
  chain.single.mockResolvedValue({ data, error: null });
  const client = { from: vi.fn(() => chain) } as unknown as SupabaseClient;
  return { client, chain };
}

describe("unified event schema", () => {
  it("accepts career placement opportunities and unknown categories", () => {
    expect(eventRecordSchema.parse(baseRecord).category).toBe("career_placement");
    expect(eventRecordSchema.parse({ ...baseRecord, category: "unknown" }).category).toBe(
      "unknown",
    );
  });

  it("keeps official/email and solo/student in one record shape", () => {
    expect(
      eventRecordSchema.parse({
        ...baseRecord,
        event_type: "official",
        source: "email",
        inbound_email_id: "33333333-3333-4333-8333-333333333333",
      }).event_type,
    ).toBe("official");
    expect(
      eventRecordSchema.parse({
        ...baseRecord,
        event_type: "solo",
        source: "student",
        organizer_user_id: "44444444-4444-4444-8444-444444444444",
        organization_id: null,
        source_email: null,
      }).event_type,
    ).toBe("solo");
  });

  it("rejects invalid source/type and online-location combinations", () => {
    expect(() =>
      eventRecordSchema.parse({ ...baseRecord, source: "student", event_type: "official" }),
    ).toThrow("Student events must be solo");
    expect(() =>
      studentEventInputSchema.parse({
        title: "Remote Study",
        location_type: "online",
        meeting_url: null,
      }),
    ).toThrow("Online events need a meeting URL");
    expect(() =>
      studentEventInputSchema.parse({
        title: "Unsafe Link",
        registration_url: "javascript:alert(1)",
      }),
    ).toThrow("URL must use HTTP or HTTPS");
  });
});

describe("event CRUD ownership boundary", () => {
  it("lists only published events and fetches a single visible event", async () => {
    const list = clientReturning([baseRecord]);
    await expect(listPublishedEvents(list.client)).resolves.toEqual([baseRecord]);
    expect(list.chain.eq).toHaveBeenCalledWith("status", "published");

    const one = clientReturning(baseRecord);
    await expect(getEvent(one.client, baseRecord.id)).resolves.toEqual(baseRecord);
    expect(one.chain.eq).toHaveBeenCalledWith("id", baseRecord.id);
  });

  it("forces student ownership, type, source, and institutional fields on create", async () => {
    const { client, chain } = clientReturning(baseRecord);
    const userId = "44444444-4444-4444-8444-444444444444";
    await createStudentEvent(client, userId, { title: "DSA Practice" });
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "DSA Practice",
        organizer_user_id: userId,
        event_type: "solo",
        source: "student",
        organization_id: null,
        inbound_email_id: null,
        source_email: null,
      }),
    );
  });

  it("scopes update and delete to the authenticated student owner", async () => {
    const userId = "44444444-4444-4444-8444-444444444444";
    const update = clientReturning(baseRecord);
    await updateOwnedStudentEvent(update.client, userId, baseRecord.id, {
      title: "Updated Study Session",
    });
    expect(update.chain.eq).toHaveBeenCalledWith("organizer_user_id", userId);
    expect(update.chain.eq).toHaveBeenCalledWith("event_type", "solo");
    expect(update.chain.eq).toHaveBeenCalledWith("source", "student");

    const deletion = clientReturning({ id: baseRecord.id });
    await deleteOwnedStudentEvent(deletion.client, userId, baseRecord.id);
    expect(deletion.chain.delete).toHaveBeenCalledOnce();
    expect(deletion.chain.eq).toHaveBeenCalledWith("organizer_user_id", userId);
  });

  it("propagates database/RLS failures", async () => {
    const { client, chain } = clientReturning(null);
    chain.single.mockResolvedValue({ data: null, error: { message: "row-level security" } });
    await expect(
      deleteOwnedStudentEvent(
        client,
        "44444444-4444-4444-8444-444444444444",
        baseRecord.id,
      ),
    ).rejects.toThrow("row-level security");
  });
});
