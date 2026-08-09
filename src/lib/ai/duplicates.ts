import "server-only";
import type { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EventRecord } from "@/lib/events/schema";
import type { ExtractedEvent } from "./extraction";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
export type DuplicateKind = "exact" | "possible_update" | "none";

const subjectNoise = /\b(important|reminder|final|update|updated|rescheduled|revised|notice|announcement)\b/gi;

export function normalizeEventTitle(value: string) {
  return value
    .replace(subjectNoise, " ")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function titleSimilarity(left: string, right: string) {
  const a = new Set(normalizeEventTitle(left).split(" ").filter(Boolean));
  const b = new Set(normalizeEventTitle(right).split(" ").filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}

function same(value: string | null, other: string | null) {
  return (value ?? "") === (other ?? "");
}

export function classifyDuplicate(extraction: ExtractedEvent, candidate: EventRecord): DuplicateKind {
  const sameTitle = normalizeEventTitle(extraction.title) === normalizeEventTitle(candidate.title);
  const sameRegistration = Boolean(
    extraction.registration_url && candidate.registration_url && extraction.registration_url === candidate.registration_url,
  );
  const exact =
    sameTitle &&
    same(extraction.description, candidate.description) &&
    same(extraction.start_time, candidate.start_time) &&
    same(extraction.end_time, candidate.end_time) &&
    same(extraction.registration_url, candidate.registration_url) &&
    same(extraction.registration_deadline, candidate.registration_deadline) &&
    same(extraction.location, candidate.location) &&
    same(extraction.meeting_url, candidate.meeting_url) &&
    extraction.category === candidate.category &&
    extraction.content_type === candidate.content_type &&
    extraction.capacity === candidate.capacity;
  if (exact) return "exact";

  const startDistance = extraction.start_time && candidate.start_time
    ? Math.abs(new Date(extraction.start_time).getTime() - new Date(candidate.start_time).getTime())
    : Number.POSITIVE_INFINITY;
  const withinFortyFiveDays = startDistance <= 45 * 24 * 60 * 60 * 1000;
  if (sameRegistration || sameTitle || (titleSimilarity(extraction.title, candidate.title) >= 0.72 && withinFortyFiveDays)) {
    return "possible_update";
  }
  return "none";
}

export async function findDuplicateCandidate(
  admin: AdminClient,
  email: { id: string; organization_id: string | null; from_email: string },
  extraction: ExtractedEvent,
) {
  let query = admin
    .from("events")
    .select("*")
    .eq("source", "email")
    .in("status", ["published", "pending_review"])
    .neq("inbound_email_id", email.id)
    .order("created_at", { ascending: false })
    .limit(50);
  query = email.organization_id
    ? query.eq("organization_id", email.organization_id)
    : query.eq("source_email", email.from_email);
  const { data, error } = await query;
  if (error) throw error;

  let possibleUpdate: EventRecord | null = null;
  for (const row of data ?? []) {
    const candidate = row as EventRecord;
    const kind = classifyDuplicate(extraction, candidate);
    if (kind === "exact") return { kind, candidate };
    if (kind === "possible_update" && !possibleUpdate) possibleUpdate = candidate;
  }
  if (possibleUpdate) return { kind: "possible_update" as const, candidate: possibleUpdate };
  return { kind: "none" as const, candidate: null };
}
