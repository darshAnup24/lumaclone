import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiscoverExperience } from "@/components/Events/DiscoverExperience";
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
  registration_url: null,
  registration_deadline: null,
  cover_image_url: "https://res.cloudinary.com/demo/image/upload/event.jpg",
  status: "published",
  requires_approval: false,
  confidence_score: 0.95,
  possible_duplicate: false,
  proposed_update_for_event_id: null,
  created_at: "2026-08-09T10:00:00.000+05:30",
  updated_at: "2026-08-09T10:00:00.000+05:30",
  published_at: "2026-08-09T10:00:00.000+05:30",
};

describe("Discover, profile, and Settings UI contracts", () => {
  it("renders compact image-led events and category navigation", () => {
    const html = renderToStaticMarkup(
      React.createElement(DiscoverExperience, {
        events: [event],
        allEvents: [event],
        activeFilter: "all",
        configured: true,
        unavailable: false,
      }),
    );

    expect(html).toContain("Popular Events");
    expect(html).toContain("Browse by Category");
    expect(html).toContain("Newly Added");
    expect(html).toContain("/events/" + event.id);
    expect(html).toContain("/discover?filter=hackathon");
    expect(html).toContain("res.cloudinary.com");
    expect(html).toContain("1 event");
  });

  it("provides a real profile page and Cloudinary-backed avatar endpoint", () => {
    const profile = readFileSync("src/app/profile/page.tsx", "utf8");
    const upload = readFileSync("src/app/api/user/upload-image/route.ts", "utf8");

    expect(profile).toContain("Hosted Events");
    expect(profile).toContain('href="/settings"');
    expect(upload).toContain("cloudinary.v2.uploader.upload");
    expect(upload).toContain('.from("profiles")');
    expect(upload).toContain("avatar_url");
  });

  it("removes payment and placeholder account surfaces from Settings", () => {
    const settings = readFileSync("src/components/Settings/SettingsForm.tsx", "utf8");

    expect(settings).toContain("AccountSettingsForm");
    expect(settings).toContain("PrimaryEmailSection");
    expect(settings).toContain("NotificationPreferences");
    expect(settings).not.toMatch(/payment|PhoneSection|SecuritySection|ActiveDevices/);
  });
});
