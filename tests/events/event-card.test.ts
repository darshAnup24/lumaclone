import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EventCard } from "@/components/Events/EventCard";
import { categoryCoverImages } from "@/lib/events/cover";
import type { EventRecord } from "@/lib/events/schema";

const event: EventRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Campus Hackathon",
  description: "Build for campus.",
  event_type: "official",
  source: "email",
  content_type: "event",
  category: "hackathon",
  organizer_user_id: null,
  organization_id: null,
  inbound_email_id: "22222222-2222-4222-8222-222222222222",
  source_email: "club@campus.edu",
  start_time: "2026-08-20T10:00:00.000+05:30",
  end_time: "2026-08-20T18:00:00.000+05:30",
  timezone: "Asia/Kolkata",
  location_type: "physical",
  location: "Innovation Lab",
  meeting_url: null,
  capacity: 100,
  registration_url: "https://campus.example/register",
  registration_deadline: null,
  cover_image_url: null,
  status: "published",
  requires_approval: false,
  confidence_score: 0.95,
  possible_duplicate: false,
  proposed_update_for_event_id: null,
  created_at: "2026-08-09T10:00:00.000+05:30",
  updated_at: "2026-08-09T10:00:00.000+05:30",
  published_at: "2026-08-09T10:00:00.000+05:30",
};

describe("existing Luma event card integration", () => {
  it("links a unified published event to its real detail route", () => {
    const html = renderToStaticMarkup(React.createElement(EventCard, { event }));
    expect(html).toContain(`/events/${event.id}`);
    expect(html).toContain("Campus Hackathon");
    expect(html).toContain("Official");
    expect(html).toContain("Innovation Lab");
  });

  it("uses the same card for a student solo activity", () => {
    const html = renderToStaticMarkup(
      React.createElement(EventCard, {
        event: {
          ...event,
          event_type: "solo",
          source: "student",
          category: "study",
          organization_id: null,
          inbound_email_id: null,
          source_email: null,
        },
      }),
    );
    expect(html).toContain("Student activity");
    expect(html).toContain("Study");
  });

  it("shows the category cover when the event has no image", () => {
    const html = renderToStaticMarkup(React.createElement(EventCard, { event }));
    expect(html).toContain(categoryCoverImages.hackathon);
  });
});
