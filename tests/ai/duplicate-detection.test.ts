import { describe, expect, it } from "vitest";
import { classifyDuplicate, normalizeEventTitle } from "@/lib/ai/duplicates";
import type { ExtractedEvent } from "@/lib/ai/extraction";
import type { EventRecord } from "@/lib/events/schema";

const existing: EventRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "24 Hour Hackathon",
  description: "Build together",
  event_type: "official", source: "email", content_type: "event", category: "hackathon",
  organizer_user_id: null, organization_id: "10000000-0000-4000-8000-000000000001",
  inbound_email_id: "22222222-2222-4222-8222-222222222222", source_email: "coding@college.edu",
  start_time: "2026-08-20T04:30:00.000Z", end_time: "2026-08-21T04:30:00.000Z",
  timezone: "Asia/Kolkata", location_type: "physical", location: "Main Auditorium",
  meeting_url: null, capacity: 100, registration_url: "https://college.example/hackathon",
  registration_deadline: null, cover_image_url: null, status: "published", requires_approval: false,
  confidence_score: 0.96, possible_duplicate: false, proposed_update_for_event_id: null,
  created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z",
  published_at: "2026-08-01T00:00:00.000Z",
};

const extracted: ExtractedEvent = {
  is_relevant: true, content_type: "event", title: "24 Hour Hackathon", description: "Build together",
  organizer: "Coding Club", category: "hackathon", start_time: existing.start_time,
  end_time: existing.end_time, timezone: "Asia/Kolkata", location_type: "physical",
  location: existing.location, meeting_url: null, registration_url: existing.registration_url,
  registration_deadline: null, capacity: 100, confidence: 0.95,
  date_ambiguous: false, ambiguity_reason: null,
};

describe("email duplicate and update fixtures", () => {
  it("normalizes reminder/update subject noise", () => {
    expect(normalizeEventTitle("IMPORTANT: Final Reminder — 24 Hour Hackathon")).toBe("24 hour hackathon");
  });

  it("suppresses an exact reminder instead of creating another event", () => {
    expect(classifyDuplicate({ ...extracted, title: "FINAL REMINDER: 24 Hour Hackathon" }, existing)).toBe("exact");
  });

  it("marks a moved event as a possible update", () => {
    expect(classifyDuplicate({
      ...extracted,
      title: "IMPORTANT: 24 Hour Hackathon update",
      start_time: "2026-08-21T08:30:00.000Z",
      end_time: "2026-08-22T08:30:00.000Z",
    }, existing)).toBe("possible_update");
  });

  it("uses a matching registration URL as a strong update signal", () => {
    expect(classifyDuplicate({ ...extracted, title: "Hackathon schedule revised", location: "Innovation Lab" }, existing)).toBe("possible_update");
  });

  it("does not merge an unrelated event", () => {
    expect(classifyDuplicate({ ...extracted, title: "Photography walk", registration_url: null, start_time: "2027-01-10T10:00:00.000Z" }, existing)).toBe("none");
  });
});
