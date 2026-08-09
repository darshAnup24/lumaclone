import { z } from "zod";
import {
  eventCategories,
  eventContentTypes,
  eventLocationTypes,
  eventSources,
  eventStatuses,
  eventTypes,
} from "./constants";

const optionalUrl = z
  .string()
  .url()
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    message: "URL must use HTTP or HTTPS.",
  })
  .nullable();
const optionalTimestamp = z.string().datetime({ offset: true }).nullable();

export const eventRecordSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(240),
    description: z.string().nullable(),
    event_type: z.enum(eventTypes),
    source: z.enum(eventSources),
    content_type: z.enum(eventContentTypes),
    category: z.enum(eventCategories),
    organizer_user_id: z.string().uuid().nullable(),
    organization_id: z.string().uuid().nullable(),
    inbound_email_id: z.string().uuid().nullable(),
    source_email: z.string().email().nullable(),
    start_time: optionalTimestamp.default(null),
    end_time: optionalTimestamp.default(null),
    timezone: z.string().min(1),
    location_type: z.enum(eventLocationTypes),
    location: z.string().nullable(),
    meeting_url: optionalUrl,
    capacity: z.number().int().positive().nullable(),
    registration_url: optionalUrl,
    registration_deadline: optionalTimestamp,
    cover_image_url: optionalUrl,
    status: z.enum(eventStatuses),
    requires_approval: z.boolean(),
    confidence_score: z.number().min(0).max(1).nullable(),
    possible_duplicate: z.boolean(),
    proposed_update_for_event_id: z.string().uuid().nullable().default(null),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    published_at: optionalTimestamp,
  })
  .superRefine((event, context) => {
    if (event.source === "student" && event.event_type !== "solo") {
      context.addIssue({ code: "custom", message: "Student events must be solo." });
    }
    if (event.source === "email" && event.event_type !== "official") {
      context.addIssue({ code: "custom", message: "Email events must be official." });
    }
    if (event.location_type === "online" && !event.meeting_url) {
      context.addIssue({ code: "custom", message: "Online events need a meeting URL." });
    }
    if (event.start_time && event.end_time && event.end_time < event.start_time) {
      context.addIssue({ code: "custom", message: "Event end must follow its start." });
    }
  });

const studentEventBaseSchema = z.object({
    title: z.string().trim().min(1).max(240),
    description: z.string().trim().max(10000).nullable().default(null),
    category: z.enum(eventCategories).default("unknown"),
    content_type: z.enum(eventContentTypes).default("event"),
    start_time: optionalTimestamp.default(null),
    end_time: optionalTimestamp.default(null),
    timezone: z.string().min(1).default("Asia/Kolkata"),
    location_type: z.enum(eventLocationTypes).default("tbd"),
    location: z.string().trim().max(500).nullable().default(null),
    meeting_url: optionalUrl.default(null),
    capacity: z.number().int().positive().nullable().default(null),
    registration_url: optionalUrl.default(null),
    registration_deadline: optionalTimestamp.default(null),
    cover_image_url: optionalUrl.default(null),
    requires_approval: z.boolean().default(true),
    status: z.enum(["draft", "published"]).default("draft"),
  });

export const studentEventInputSchema = studentEventBaseSchema.superRefine(
  (event, context) => {
    if (event.location_type === "online" && !event.meeting_url) {
      context.addIssue({ code: "custom", message: "Online events need a meeting URL." });
    }
    if (event.start_time && event.end_time && event.end_time < event.start_time) {
      context.addIssue({ code: "custom", message: "Event end must follow its start." });
    }
  },
);

export const studentEventUpdateSchema = studentEventBaseSchema.partial().omit({
  status: true,
});

export type EventRecord = z.infer<typeof eventRecordSchema>;
export type StudentEventInput = z.input<typeof studentEventInputSchema>;
export type StudentEventUpdate = z.input<typeof studentEventUpdateSchema>;
