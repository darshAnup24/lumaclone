export const eventTypes = ["official", "solo"] as const;
export const eventSources = ["email", "student", "admin"] as const;
export const eventCategories = [
  "hackathon",
  "conference",
  "workshop",
  "seminar",
  "competition",
  "club_activity",
  "career_placement",
  "social",
  "sports",
  "study",
  "networking",
  "cultural",
  "other",
  "unknown",
] as const;
export const eventStatuses = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "cancelled",
  "completed",
] as const;
export const eventContentTypes = [
  "event",
  "deadline",
  "announcement",
  "opportunity",
  "other",
] as const;
export const eventLocationTypes = ["physical", "online", "hybrid", "tbd"] as const;
