import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { extractEvent } from "./provider";
import { extractionPublicationStatus } from "./extraction";
import { findDuplicateCandidate } from "./duplicates";

export async function processInboundEmail(messageId: string) {
  const admin = createSupabaseAdminClient();
  try {
    const { data: email, error } = await admin.from("inbound_emails").select("*").eq("message_id", messageId).single();
    if (error || !email) throw error ?? new Error("Inbound email not found");
    const { data: alreadyProcessed } = await admin
      .from("events")
      .select("id,status")
      .eq("inbound_email_id", email.id)
      .maybeSingle();
    if (alreadyProcessed) {
      return { status: alreadyProcessed.status, eventId: alreadyProcessed.id };
    }
    await admin.from("inbound_emails").update({ processing_status: "processing", error_message: null }).eq("id", email.id);
    const extraction = await extractEvent({ subject: email.subject, text: email.text_body, html: email.html_body, receivedAt: email.received_at });
    const initialStatus = extractionPublicationStatus(extraction);
    let finalStatus = initialStatus;
    let eventId: string | null = null;
    if (extraction.is_relevant) {
      const duplicate = await findDuplicateCandidate(admin, email, extraction);
      if (duplicate.kind === "exact") {
        await admin.from("inbound_emails").update({
          extraction_result: { ...extraction, duplicate_detection: { kind: "exact", event_id: duplicate.candidate.id } },
          processing_status: "extracted",
          error_message: `Exact duplicate of event ${duplicate.candidate.id}`,
        }).eq("id", email.id);
        return { status: "duplicate" as const, eventId: duplicate.candidate.id };
      }
      const status = duplicate.kind === "possible_update" ? "pending_review" : initialStatus;
      finalStatus = status;
      const { data: event, error: eventError } = await admin.from("events").insert({
        title: extraction.title, description: extraction.description, event_type: "official", source: "email",
        content_type: extraction.content_type, category: extraction.category, organization_id: email.organization_id,
        inbound_email_id: email.id, source_email: email.from_email, start_time: extraction.start_time, end_time: extraction.end_time,
        timezone: extraction.timezone, location_type: extraction.location_type, location: extraction.location,
        meeting_url: extraction.meeting_url, capacity: extraction.capacity, registration_url: extraction.registration_url,
        registration_deadline: extraction.registration_deadline, status, requires_approval: false,
        confidence_score: extraction.confidence, possible_duplicate: duplicate.kind === "possible_update",
        proposed_update_for_event_id: duplicate.candidate?.id ?? null,
        published_at: status === "published" ? new Date().toISOString() : null,
      }).select("id").single();
      if (eventError) throw eventError;
      eventId = event.id;
    }
    await admin.from("inbound_emails").update({ extraction_result: extraction, processing_status: finalStatus === "published" && eventId ? "published" : finalStatus === "rejected" ? "extracted" : "needs_review" }).eq("id", email.id);
    return { status: finalStatus, eventId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI extraction failed";
    await admin.from("inbound_emails").update({ processing_status: "failed", error_message: message }).eq("message_id", messageId);
    console.error("Inbound AI extraction failed", { messageId, error });
    return { status: "failed" as const, eventId: null };
  }
}
