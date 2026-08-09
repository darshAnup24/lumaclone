import "server-only";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventRecordSchema, type EventRecord } from "@/lib/events/schema";
import type { AdminReviewInput } from "./schema";

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface ReviewOrganization {
  id: string;
  name: string;
}

export interface AdminReviewItem {
  event: EventRecord;
  proposedUpdateFor: EventRecord | null;
  organizationName: string | null;
  inbound: {
    from_email: string;
    subject: string;
    received_at: string;
    attachment_metadata: unknown[];
  } | null;
}

export async function listAdminReviewItems(supabase: ServerSupabaseClient) {
  const [{ data: rows, error }, { data: organizations, error: organizationsError }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*, organizations(name), inbound_emails(from_email, subject, received_at, attachment_metadata)")
        .eq("source", "email")
        .in("status", ["pending_review", "rejected"])
        .order("created_at", { ascending: false }),
      supabase
        .from("organizations")
        .select("id, name")
        .eq("is_verified", true)
        .order("name"),
    ]);
  if (error) throw error;
  if (organizationsError) throw organizationsError;

  const candidateIds = (rows ?? [])
    .map((row) => row.proposed_update_for_event_id)
    .filter((id): id is string => typeof id === "string");
  const { data: candidates, error: candidatesError } = candidateIds.length
    ? await supabase.from("events").select("*").in("id", candidateIds)
    : { data: [], error: null };
  if (candidatesError) throw candidatesError;
  const candidateMap = new Map(
    (candidates ?? []).map((candidate) => {
      const parsed = eventRecordSchema.parse(candidate);
      return [parsed.id, parsed] as const;
    }),
  );

  const items: AdminReviewItem[] = (rows ?? []).map((row) => {
    const { organizations: organization, inbound_emails: inbound, ...event } = row;
    const organizationRow = Array.isArray(organization) ? organization[0] : organization;
    const inboundRow = Array.isArray(inbound) ? inbound[0] : inbound;
    return {
      event: eventRecordSchema.parse(event),
      proposedUpdateFor: row.proposed_update_for_event_id
        ? candidateMap.get(row.proposed_update_for_event_id) ?? null
        : null,
      organizationName: organizationRow?.name ?? null,
      inbound: inboundRow
        ? {
            from_email: inboundRow.from_email,
            subject: inboundRow.subject,
            received_at: inboundRow.received_at,
            attachment_metadata: Array.isArray(inboundRow.attachment_metadata)
              ? inboundRow.attachment_metadata
              : [],
          }
        : null,
    };
  });

  return {
    items,
    organizations: (organizations ?? []) as ReviewOrganization[],
  };
}

export async function reviewInboundEvent(
  supabase: ServerSupabaseClient,
  eventId: string,
  input: AdminReviewInput,
) {
  const { data: current, error: currentError } = await supabase
    .from("events")
    .select("proposed_update_for_event_id,possible_duplicate")
    .eq("id", eventId)
    .eq("source", "email")
    .single();
  if (currentError) throw currentError;
  const isProposal = Boolean(current.possible_duplicate && current.proposed_update_for_event_id);
  if (input.action === "publish" && isProposal) {
    throw new Error("Resolve this possible update before publishing.");
  }
  if (["apply_update", "create_new"].includes(input.action) && !isProposal) {
    throw new Error("This event is not an update proposal.");
  }

  const editable = {
    ...input.event,
    organization_id: input.event.organization_id || null,
    updated_at: new Date().toISOString(),
  };
  if (isProposal && ["apply_update", "create_new", "reject"].includes(input.action)) {
    const { error: editError } = await supabase
      .from("events")
      .update(editable)
      .eq("id", eventId)
      .eq("source", "email")
      .eq("possible_duplicate", true);
    if (editError) throw editError;
    const { data, error } = await supabase.rpc("resolve_event_proposal", {
      proposal_id: eventId,
      decision: input.action,
    });
    if (error) throw error;
    return eventRecordSchema.parse(data);
  }

  const publishedAt = input.action === "publish" ? new Date().toISOString() : null;
  const status = input.action === "publish" ? "published" : "rejected";
  const update = {
    ...editable,
    status,
    published_at: publishedAt,
  };

  const { data: event, error } = await supabase
    .from("events")
    .update(update)
    .eq("id", eventId)
    .eq("source", "email")
    .in("status", ["pending_review", "rejected"])
    .select("*")
    .single();
  if (error) throw error;

  if (event.inbound_email_id) {
    const { error: inboundError } = await supabase
      .from("inbound_emails")
      .update({ processing_status: status })
      .eq("id", event.inbound_email_id);
    if (inboundError) throw inboundError;
  }
  return eventRecordSchema.parse(event);
}
