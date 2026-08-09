import { describe, expect, it } from "vitest";
import type { EventRecord } from "@/lib/events/schema";
import {
  filterEvents,
  formatEventDate,
  formatEventLocation,
  groupEventsByDay,
  parseDiscoveryFilter,
} from "@/lib/events/presentation";

const base: EventRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Campus Hackathon",
  description: null,
  event_type: "official",
  source: "admin",
  content_type: "event",
  category: "hackathon",
  organizer_user_id: null,
  organization_id: null,
  inbound_email_id: null,
  source_email: null,
  start_time: "2026-08-20T10:00:00.000+05:30",
  end_time: "2026-08-20T12:00:00.000+05:30",
  timezone: "Asia/Kolkata",
  location_type: "physical",
  location: "Main Auditorium",
  meeting_url: null,
  capacity: 200,
  registration_url: null,
  registration_deadline: null,
  cover_image_url: null,
  status: "published",
  requires_approval: false,
  confidence_score: null,
  possible_duplicate: false,
  proposed_update_for_event_id: null,
  created_at: "2026-08-09T10:00:00.000+05:30",
  updated_at: "2026-08-09T10:00:00.000+05:30",
  published_at: "2026-08-09T10:00:00.000+05:30",
};

describe("event discovery presentation", () => {
  it("normalizes supported and unsupported filters", () => {
    expect(parseDiscoveryFilter("student")).toBe("student");
    expect(parseDiscoveryFilter(["workshop", "sports"])).toBe("workshop");
    expect(parseDiscoveryFilter("not-a-filter")).toBe("all");
  });

  it("filters official, student, and category views without splitting the model", () => {
    const student = {
      ...base,
      id: "22222222-2222-4222-8222-222222222222",
      event_type: "solo" as const,
      source: "student" as const,
      category: "study" as const,
    };
    const events = [base, student];
    expect(filterEvents(events, "official")).toEqual([base]);
    expect(filterEvents(events, "student")).toEqual([student]);
    expect(filterEvents(events, "study")).toEqual([student]);
  });

  it("formats schedule and location with resilient fallbacks", () => {
    expect(formatEventDate(base)).toContain("20 Aug");
    expect(formatEventLocation(base)).toBe("Main Auditorium");
    expect(
      formatEventDate({ ...base, start_time: null, registration_deadline: null }),
    ).toBe("Date to be announced");
    expect(formatEventLocation({ ...base, location_type: "online" })).toBe("Online");
  });

  it("groups unified official and solo events by schedule day", () => {
    const groups = groupEventsByDay([
      base,
      { ...base, id: "22222222-2222-4222-8222-222222222222", event_type: "solo" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].events).toHaveLength(2);
  });
});
