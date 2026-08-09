import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const enabled = process.env.LIVE_SUPABASE_VALIDATION === "1";
const liveDescribe = enabled ? describe : describe.skip;

function configuredClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) throw new Error("Supabase live validation environment is incomplete");
  return {
    url,
    anonKey,
    service: createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

async function userClient(url: string, anonKey: string, email: string, password: string) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

liveDescribe("live cloud RLS and end-to-end abuse validation", () => {
  it("rejects unauthorized mutations and permits the intended campus flows", async () => {
    const { url, anonKey, service } = configuredClients();
    const run = randomUUID().slice(0, 8);
    const password = `Campus-${randomUUID()}-aA1!`;
    const emails = {
      owner: `codex-owner-${run}@example.com`,
      attacker: `codex-attacker-${run}@example.com`,
      participant: `codex-participant-${run}@example.com`,
      admin: `codex-admin-${run}@example.com`,
    };
    const userIds: string[] = [];
    let organizationId: string | null = null;
    let inboundId: string | null = null;
    let studentEventId: string | null = null;
    let emailEventId: string | null = null;

    try {
      const createdUsers = await Promise.all(
        Object.values(emails).map((email) =>
          service.auth.admin.createUser({ email, password, email_confirm: true }),
        ),
      );
      for (const { data, error } of createdUsers) {
        if (error || !data.user) throw error ?? new Error("Synthetic user creation failed");
        userIds.push(data.user.id);
      }
      const [ownerId, attackerId, participantId, adminId] = userIds;
      const { error: promoteError } = await service.from("profiles").update({ role: "admin" }).eq("id", adminId);
      if (promoteError) throw promoteError;

      const [owner, attacker, participant, admin] = await Promise.all([
        userClient(url, anonKey, emails.owner, password),
        userClient(url, anonKey, emails.attacker, password),
        userClient(url, anonKey, emails.participant, password),
        userClient(url, anonKey, emails.admin, password),
      ]);

      const { data: organization, error: organizationError } = await service.from("organizations").insert({
        name: `Codex Security Club ${run}`,
        email_patterns: [emails.admin],
        is_verified: true,
        is_official: true,
      }).select("id").single();
      if (organizationError) throw organizationError;
      organizationId = organization.id;

      const eventStart = new Date(Date.now() + 7 * 86_400_000).toISOString();
      const eventEnd = new Date(Date.now() + 7 * 86_400_000 + 3_600_000).toISOString();
      const { data: studentEvent, error: studentEventError } = await owner.from("events").insert({
        title: `Codex Study ${run}`, event_type: "solo", source: "student", content_type: "event",
        category: "study", organizer_user_id: ownerId, organization_id: null,
        start_time: eventStart, end_time: eventEnd, timezone: "Asia/Kolkata",
        location_type: "physical", location: "Test Room", status: "published",
        requires_approval: true, published_at: new Date().toISOString(),
      }).select("id,organizer_user_id").single();
      if (studentEventError) throw studentEventError;
      studentEventId = studentEvent.id;

      const { data: crossEdit, error: crossEditError } = await attacker.from("events")
        .update({ title: "Unauthorized edit" }).eq("id", studentEventId).select("id");
      expect(crossEditError).toBeNull();
      expect(crossEdit).toEqual([]);

      const { data: ownershipEdit, error: ownershipError } = await owner.from("events")
        .update({ organizer_user_id: attackerId }).eq("id", studentEventId).select("organizer_user_id").single();
      expect(ownershipError).toBeNull();
      expect(ownershipEdit?.organizer_user_id).toBe(ownerId);

      const { data: selfRequest, error: selfRequestError } = await service.from("event_requests").insert({
        event_id: studentEventId, user_id: ownerId, status: "pending",
      }).select("id").single();
      if (selfRequestError) throw selfRequestError;
      const selfAccept = await owner.rpc("respond_to_event_request", { request_id: selfRequest.id, decision: "accepted" });
      expect(selfAccept.error?.message.toLowerCase()).toContain("own request");
      await service.from("event_requests").delete().eq("id", selfRequest.id);

      const { data: request, error: requestError } = await participant.from("event_requests").insert({
        event_id: studentEventId, user_id: participantId, status: "pending",
      }).select("id").single();
      if (requestError) throw requestError;
      const foreignAccept = await attacker.rpc("respond_to_event_request", { request_id: request.id, decision: "accepted" });
      expect(foreignAccept.error?.message.toLowerCase()).toContain("only the organizer");
      const accepted = await owner.rpc("respond_to_event_request", { request_id: request.id, decision: "accepted" });
      expect(accepted.error).toBeNull();
      expect(accepted.data?.status).toBe("accepted");

      const { data: notification, error: notificationError } = await service.from("notifications").insert({
        user_id: ownerId, event_id: studentEventId, type: "event_updated",
        title: "Synthetic notice", message: "Security validation",
      }).select("id,title").single();
      if (notificationError) throw notificationError;
      const { data: notificationEdit, error: notificationEditError } = await attacker.from("notifications")
        .update({ title: "Unauthorized" }).eq("id", notification.id).select("id");
      expect(notificationEditError).toBeNull();
      expect(notificationEdit).toEqual([]);

      const organizationEdit = await attacker.from("organizations")
        .update({ is_verified: false }).eq("id", organizationId).select("id");
      expect(organizationEdit.error).toBeNull();
      expect(organizationEdit.data).toEqual([]);

      const { data: inbound, error: inboundError } = await service.from("inbound_emails").insert({
        message_id: `codex-security-${run}`, from_email: emails.admin, to_email: "events@example.com",
        subject: "Security Test Conference", received_at: new Date().toISOString(),
        processing_status: "needs_review", organization_id: organizationId,
      }).select("id").single();
      if (inboundError) throw inboundError;
      inboundId = inbound.id;
      const { data: emailEvent, error: emailEventError } = await service.from("events").insert({
        title: `Security Conference ${run}`, event_type: "official", source: "email", content_type: "event",
        category: "conference", organization_id: organizationId, inbound_email_id: inboundId,
        source_email: emails.admin, start_time: eventStart, end_time: eventEnd, timezone: "Asia/Kolkata",
        location_type: "physical", location: "Auditorium", status: "pending_review",
        requires_approval: false, confidence_score: 0.7,
      }).select("id").single();
      if (emailEventError) throw emailEventError;
      emailEventId = emailEvent.id;

      const nonAdminPublish = await attacker.from("events").update({
        status: "published", published_at: new Date().toISOString(),
      }).eq("id", emailEventId).select("id");
      expect(nonAdminPublish.error).toBeNull();
      expect(nonAdminPublish.data).toEqual([]);

      const adminPublish = await admin.from("events").update({
        status: "published", published_at: new Date().toISOString(),
      }).eq("id", emailEventId).select("id,status").single();
      expect(adminPublish.error).toBeNull();
      expect(adminPublish.data?.status).toBe("published");

      const visible = await participant.from("events").select("id").eq("id", emailEventId).single();
      expect(visible.error).toBeNull();
      expect(visible.data?.id).toBe(emailEventId);

      const notifications = await service.from("notifications").select("user_id,type").eq("event_id", studentEventId);
      expect(notifications.error).toBeNull();
      expect(notifications.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ user_id: ownerId, type: "new_request" }),
        expect.objectContaining({ user_id: participantId, type: "request_accepted" }),
      ]));
    } finally {
      await Promise.all([
        studentEventId ? service.from("notifications").delete().eq("event_id", studentEventId) : null,
        studentEventId ? service.from("event_requests").delete().eq("event_id", studentEventId) : null,
      ]);
      await Promise.all([
        emailEventId ? service.from("events").delete().eq("id", emailEventId) : null,
        studentEventId ? service.from("events").delete().eq("id", studentEventId) : null,
      ]);
      if (inboundId) await service.from("inbound_emails").delete().eq("id", inboundId);
      if (organizationId) await service.from("organizations").delete().eq("id", organizationId);
      await Promise.all(userIds.map((userId) => service.auth.admin.deleteUser(userId)));
    }
  }, 240_000);
});
