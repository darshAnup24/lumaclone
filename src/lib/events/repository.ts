import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventRecordSchema,
  studentEventInputSchema,
  studentEventUpdateSchema,
  type EventRecord,
  type StudentEventInput,
  type StudentEventUpdate,
} from "./schema";

function resultOrThrow<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function listPublishedEvents(client: SupabaseClient) {
  const result = await client
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("start_time", { ascending: true, nullsFirst: false });
  return eventRecordSchema.array().parse(resultOrThrow(result)) as EventRecord[];
}

export async function getEvent(client: SupabaseClient, id: string) {
  const result = await client.from("events").select("*").eq("id", id).maybeSingle();
  const event = resultOrThrow(result);
  return event ? eventRecordSchema.parse(event) : null;
}

export async function createStudentEvent(
  client: SupabaseClient,
  userId: string,
  input: StudentEventInput,
) {
  const event = studentEventInputSchema.parse(input);
  const result = await client
    .from("events")
    .insert({
      ...event,
      event_type: "solo",
      source: "student",
      organizer_user_id: userId,
      organization_id: null,
      inbound_email_id: null,
      source_email: null,
      confidence_score: null,
      possible_duplicate: false,
      published_at: event.status === "published" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  return resultOrThrow(result) as EventRecord;
}

export async function updateOwnedStudentEvent(
  client: SupabaseClient,
  userId: string,
  eventId: string,
  input: StudentEventUpdate,
) {
  const update = studentEventUpdateSchema.parse(input);
  const result = await client
    .from("events")
    .update(update)
    .eq("id", eventId)
    .eq("organizer_user_id", userId)
    .eq("event_type", "solo")
    .eq("source", "student")
    .select("*")
    .single();
  return resultOrThrow(result) as EventRecord;
}

export async function deleteOwnedStudentEvent(
  client: SupabaseClient,
  userId: string,
  eventId: string,
) {
  const result = await client
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("organizer_user_id", userId)
    .eq("event_type", "solo")
    .eq("source", "student")
    .select("id")
    .single();
  return resultOrThrow(result) as { id: string };
}
