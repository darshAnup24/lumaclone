import { z } from "zod";
import {
  eventCategories,
  eventContentTypes,
  eventLocationTypes,
  eventTypes,
} from "@/lib/events/constants";

const nullableHttpUrl = z
  .union([z.null(), z.literal(""), z.string().url()])
  .transform((value) => value || null)
  .refine((value) => !value || ["http:", "https:"].includes(new URL(value).protocol), {
    message: "URL must use HTTP or HTTPS.",
  });
const nullableTimestamp = z
  .union([z.null(), z.literal(""), z.string().datetime({ offset: true })])
  .transform((value) => value || null);

export const adminReviewSchema = z
  .object({
    action: z.enum(["publish", "reject", "apply_update", "create_new"]),
    event: z.object({
      title: z.string().trim().min(1).max(240),
      description: z.string().trim().max(10000).nullable(),
      category: z.enum(eventCategories),
      organization_id: z.union([z.literal(""), z.string().uuid()]).nullable(),
      event_type: z.enum(eventTypes),
      content_type: z.enum(eventContentTypes),
      start_time: nullableTimestamp,
      end_time: nullableTimestamp,
      timezone: z.string().trim().min(1).max(100),
      location_type: z.enum(eventLocationTypes),
      location: z.string().trim().max(500).nullable(),
      meeting_url: nullableHttpUrl,
      capacity: z.number().int().positive().nullable(),
      registration_url: nullableHttpUrl,
      registration_deadline: nullableTimestamp,
      confidence_score: z.number().min(0).max(1).nullable(),
      possible_duplicate: z.boolean(),
    }),
  })
  .superRefine((input, context) => {
    if (["publish", "apply_update", "create_new"].includes(input.action) && input.event.category === "unknown") {
      context.addIssue({
        code: "custom",
        path: ["event", "category"],
        message: "Choose a category before publishing.",
      });
    }
    if (input.event.start_time && input.event.end_time && input.event.end_time < input.event.start_time) {
      context.addIssue({ code: "custom", path: ["event", "end_time"], message: "End must follow start." });
    }
    if (input.event.location_type === "online" && !input.event.meeting_url) {
      context.addIssue({ code: "custom", path: ["event", "meeting_url"], message: "Online events need a meeting URL." });
    }
  });

export type AdminReviewInput = z.infer<typeof adminReviewSchema>;
