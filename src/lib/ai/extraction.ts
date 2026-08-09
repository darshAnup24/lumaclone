import { z } from "zod";
import { eventCategories, eventContentTypes, eventLocationTypes } from "@/lib/events/constants";

const nullableTimestamp = z.string().datetime({ offset: true }).nullable();
const httpUrl = z.string().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol)).nullable();

export const extractedEventSchema = z.object({
  is_relevant: z.boolean(),
  content_type: z.enum(eventContentTypes),
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(10000).nullable(),
  organizer: z.string().trim().max(160).nullable(),
  category: z.enum(eventCategories),
  start_time: nullableTimestamp,
  end_time: nullableTimestamp,
  timezone: z.string().min(1),
  location_type: z.enum(eventLocationTypes),
  location: z.string().trim().max(500).nullable(),
  meeting_url: httpUrl,
  registration_url: httpUrl,
  registration_deadline: nullableTimestamp,
  capacity: z.number().int().positive().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  date_ambiguous: z.boolean(),
  ambiguity_reason: z.string().nullable(),
}).superRefine((value, context) => {
  if (value.start_time && value.end_time && value.end_time < value.start_time) {
    context.addIssue({ code: "custom", message: "End time must follow start time" });
  }
  if (value.location_type === "online" && !value.meeting_url) {
    context.addIssue({ code: "custom", message: "Online content needs a meeting URL" });
  }
});

export type ExtractedEvent = z.infer<typeof extractedEventSchema>;

export function normalizeExtraction(input: Record<string, unknown>) {
  const aliases: Record<string, string> = {
    hackathons: "hackathon",
    conferences: "conference",
    workshops: "workshop",
    competitions: "competition",
    "career_placement": "career_placement",
    placement: "career_placement",
    career: "career_placement",
    club_activities: "club_activity",
  };
  const candidate = typeof input.category === "string"
    ? input.category.trim().toLowerCase().replace(/[\s/&-]+/g, "_")
    : "";
  const normalized = aliases[candidate] ?? candidate;
  const category = (eventCategories as readonly string[]).includes(normalized)
    ? normalized
    : "other";

  const sanitized: Record<string, unknown> = {
    ...input,
    category,
    confidence: input.confidence ?? null,
  };

  const timestampFields = ["start_time", "end_time", "registration_deadline"] as const;
  const timestampParser = z.string().datetime({ offset: true });
  for (const field of timestampFields) {
    const value = sanitized[field];
    if (value == null) continue;
    if (typeof value !== "string" || !timestampParser.safeParse(value).success) {
      sanitized[field] = null;
    }
  }

  const urlFields = ["meeting_url", "registration_url"] as const;
  for (const field of urlFields) {
    const value = sanitized[field];
    if (value == null) continue;
    const validUrl =
      typeof value === "string" &&
      (() => {
        try {
          return ["http:", "https:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      })();
    if (!validUrl) sanitized[field] = null;
  }

  const parsed = extractedEventSchema.parse(sanitized);
  if (!parsed.start_time) {
    return {
      ...parsed,
      date_ambiguous: true,
      ambiguity_reason: parsed.ambiguity_reason ?? "No start time extracted",
    };
  }
  return parsed;
}

export function extractionPublicationStatus(
  extraction: ExtractedEvent,
  threshold = Number(process.env.AI_AUTO_PUBLISH_THRESHOLD ?? "0.75"),
) {
  if (!extraction.is_relevant) return "rejected" as const;
  if (extraction.date_ambiguous) return "pending_review" as const;
  if (extraction.confidence === null || extraction.confidence >= threshold) return "published" as const;
  return "pending_review" as const;
}

export const extractionJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["is_relevant", "content_type", "title", "description", "organizer", "category", "start_time", "end_time", "timezone", "location_type", "location", "meeting_url", "registration_url", "registration_deadline", "capacity", "confidence", "date_ambiguous", "ambiguity_reason"],
  properties: {
    is_relevant: { type: "boolean" }, content_type: { type: "string", enum: eventContentTypes },
    title: { type: "string" }, description: { type: ["string", "null"] }, organizer: { type: ["string", "null"] },
    category: { type: "string" }, start_time: { type: ["string", "null"] }, end_time: { type: ["string", "null"] },
    timezone: { type: "string" }, location_type: { type: "string", enum: eventLocationTypes }, location: { type: ["string", "null"] },
    meeting_url: { type: ["string", "null"] }, registration_url: { type: ["string", "null"] }, registration_deadline: { type: ["string", "null"] },
    capacity: { type: ["integer", "null"] }, confidence: { type: ["number", "null"], minimum: 0, maximum: 1 },
    date_ambiguous: { type: "boolean" }, ambiguity_reason: { type: ["string", "null"] },
  },
} as const;
