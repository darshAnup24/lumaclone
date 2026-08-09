import { describe, expect, it } from "vitest";
import { adminReviewSchema } from "@/lib/admin/schema";

const event = {
  title: "24 Hour Hackathon",
  description: "Build through the night.",
  category: "hackathon",
  organization_id: "10000000-0000-4000-8000-000000000001",
  event_type: "official",
  content_type: "event",
  start_time: "2026-08-25T04:30:00.000Z",
  end_time: "2026-08-26T04:30:00.000Z",
  timezone: "Asia/Kolkata",
  location_type: "physical",
  location: "Main Auditorium",
  meeting_url: null,
  capacity: 100,
  registration_url: "https://college.example/register",
  registration_deadline: "2026-08-23T18:29:59.000Z",
  confidence_score: 0.96,
  possible_duplicate: false,
} as const;

describe("admin review validation", () => {
  it("accepts edited extraction fields for publication", () => {
    expect(adminReviewSchema.parse({ action: "publish", event })).toMatchObject({
      action: "publish",
      event: { category: "hackathon", timezone: "Asia/Kolkata" },
    });
  });

  it("requires unknown categories to be corrected before publication", () => {
    expect(() =>
      adminReviewSchema.parse({ action: "publish", event: { ...event, category: "unknown" } }),
    ).toThrow("Choose a category before publishing");
  });

  it("keeps unknown and ambiguous records rejectable", () => {
    expect(
      adminReviewSchema.parse({
        action: "reject",
        event: { ...event, category: "unknown", start_time: null, end_time: null },
      }).action,
    ).toBe("reject");
  });

  it("rejects unsafe URLs and invalid event times", () => {
    expect(() =>
      adminReviewSchema.parse({ ...{ action: "publish" }, event: { ...event, registration_url: "javascript:alert(1)" } }),
    ).toThrow();
    expect(() =>
      adminReviewSchema.parse({ ...{ action: "publish" }, event: { ...event, end_time: "2026-08-24T04:30:00.000Z" } }),
    ).toThrow("End must follow start");
  });

  it.each(["apply_update", "create_new"] as const)("accepts %s for a resolved-category proposal", (action) => {
    expect(adminReviewSchema.parse({ action, event }).action).toBe(action);
  });
});
