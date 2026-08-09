import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "./resend";

type MailType = "new_request" | "request_accepted" | "request_rejected" | "event_updated" | "event_reminder";

async function deliver(userId: string, eventId: string, type: MailType, subject: string, text: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data: profile, error } = await admin.from("profiles").select("email").eq("id", userId).single();
    if (error || !profile?.email) throw error ?? new Error("Recipient email not found");
    const result = await sendTransactionalEmail({ to: profile.email, subject, text });
    await admin.from("outbound_email_logs").insert({
      user_id: userId, event_id: eventId, notification_type: type,
      recipient: profile.email, provider_message_id: result.id ?? null,
      status: result.status, error_message: result.error ?? null,
    });
  } catch (error) {
    console.error("Transactional notification email failed", { eventId, type, error });
  }
}

export async function emailOrganizerOfNewRequest(eventId: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("events").select("title,organizer_user_id").eq("id", eventId).single();
    if (data?.organizer_user_id) await deliver(data.organizer_user_id, eventId, "new_request", "New join request", `A student requested to join ${data.title}.`);
  } catch (error) { console.error("Organizer request email failed", { eventId, error }); }
}

export async function emailParticipantOfDecision(userId: string, eventId: string, accepted: boolean) {
  await deliver(userId, eventId, accepted ? "request_accepted" : "request_rejected", accepted ? "Request accepted" : "Request rejected", accepted ? "Your request to join was accepted." : "Your request to join was rejected.");
}

export async function emailAcceptedParticipants(eventId: string, type: "event_updated" | "event_reminder", title: string, message: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("event_requests").select("user_id").eq("event_id", eventId).eq("status", "accepted");
    await Promise.all((data ?? []).map(({ user_id }) => deliver(user_id, eventId, type, title, message)));
  } catch (error) { console.error("Attendee notification emails failed", { eventId, type, error }); }
}
