import { describe, expect, it } from "vitest";
import { categoryCoverImages, eventCoverUrl } from "@/lib/events/cover";
import { eventCategories } from "@/lib/events/constants";

describe("event cover images", () => {
  it("provides a remote fallback cover for every supported category", () => {
    for (const category of eventCategories) {
      expect(categoryCoverImages[category]).toMatch(
        /^https:\/\/images\.unsplash\.com\/photo-/,
      );
    }
  });

  it("prefers the event cover over the category fallback", () => {
    const cover = "https://res.cloudinary.com/example/image/upload/v1/cover.jpg";
    expect(eventCoverUrl({ category: "hackathon", cover_image_url: cover })).toBe(
      cover,
    );
    expect(eventCoverUrl({ category: "hackathon", cover_image_url: null })).toBe(
      categoryCoverImages.hackathon,
    );
  });
});
