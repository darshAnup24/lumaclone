import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const eventRequestStatuses = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
] as const;

export const eventRequestSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(eventRequestStatuses),
  requested_at: z.string().datetime({ offset: true }),
  responded_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export type EventRequestRecord = z.infer<typeof eventRequestSchema>;
export type EventRequestDecision = Extract<
  EventRequestRecord["status"],
  "accepted" | "rejected"
>;

export class EventRequestDatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "EventRequestDatabaseError";
  }
}

function resultOrThrow<T>(result: {
  data: T;
  error: { message: string; code?: string } | null;
}) {
  if (result.error) {
    throw new EventRequestDatabaseError(result.error.message, result.error.code);
  }
  return result.data;
}

export async function createJoinRequest(
  client: SupabaseClient,
  userId: string,
  eventId: string,
) {
  const result = await client
    .from("event_requests")
    .insert({ event_id: eventId, user_id: userId, status: "pending" })
    .select("*")
    .single();
  return eventRequestSchema.parse(resultOrThrow(result));
}

export async function getOwnEventRequest(
  client: SupabaseClient,
  userId: string,
  eventId: string,
) {
  const result = await client
    .from("event_requests")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  const request = resultOrThrow(result);
  return request ? eventRequestSchema.parse(request) : null;
}

export async function listEventRequests(client: SupabaseClient, eventId: string) {
  const result = await client
    .from("event_requests")
    .select("*")
    .eq("event_id", eventId)
    .order("requested_at", { ascending: true });
  return eventRequestSchema.array().parse(resultOrThrow(result));
}

export async function cancelOwnJoinRequest(
  client: SupabaseClient,
  userId: string,
  eventId: string,
) {
  const result = await client
    .from("event_requests")
    .update({ status: "cancelled", responded_at: null })
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select("*")
    .single();
  return eventRequestSchema.parse(resultOrThrow(result));
}

export async function respondToJoinRequest(
  client: SupabaseClient,
  requestId: string,
  decision: EventRequestDecision,
) {
  const result = await client.rpc("respond_to_event_request", {
    request_id: requestId,
    decision,
  });
  const response = resultOrThrow(result);
  const request = Array.isArray(response) ? response[0] : response;
  return eventRequestSchema.parse(request);
}
