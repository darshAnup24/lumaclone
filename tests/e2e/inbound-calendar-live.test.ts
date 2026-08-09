import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { processInboundEmail } from "@/lib/ai/process";
import { listPublishedEvents } from "@/lib/events/repository";

const enabled = process.env.LIVE_E2E_VALIDATION === "1";
const liveDescribe = enabled ? describe : describe.skip;

liveDescribe("live inbound email to Luma calendar pipeline", () => {
  it("extracts, publishes, and exposes a verified campus event", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceKey) throw new Error("Supabase live validation environment is incomplete");
    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const publicClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const run = randomUUID().slice(0, 8);
    const messageId = `codex-e2e-${run}`;
    const sender = `codex-e2e-${run}@college.example`;
    let organizationId: string | null = null;
    let inboundId: string | null = null;
    let eventId: string | null = null;

    try {
      const { data: organization, error: organizationError } = await service.from("organizations").insert({
        name: `Codex E2E Club ${run}`,
        email_patterns: [sender],
        is_verified: true,
        is_official: true,
      }).select("id").single();
      if (organizationError) throw organizationError;
      organizationId = organization.id;

      const { data: inbound, error: inboundError } = await service.from("inbound_emails").insert({
        message_id: messageId,
        from_email: sender,
        to_email: "events@college.example",
        subject: `Cloud Systems Workshop ${run}`,
        text_body: [
          "Official Cloud Systems Workshop for campus students.",
          "Starts: September 15, 2026 at 10:00 AM IST.",
          "Ends: September 15, 2026 at 12:00 PM IST.",
          "Location: Systems Lab 2.",
          "Category: Workshop.",
        ].join("\n"),
        received_at: "2026-08-09T10:00:00.000Z",
        processing_status: "received",
        organization_id: organizationId,
      }).select("id").single();
      if (inboundError) throw inboundError;
      inboundId = inbound.id;

      const result = await processInboundEmail(messageId);
      expect(result.status).toBe("published");
      expect(result.eventId).toBeTruthy();
      eventId = result.eventId;

      const published = await listPublishedEvents(publicClient);
      const visible = published.find((event) => event.id === eventId);
      expect(visible).toMatchObject({
        source: "email",
        event_type: "official",
        category: "workshop",
        status: "published",
        organization_id: organizationId,
        inbound_email_id: inboundId,
      });
    } finally {
      if (eventId) await service.from("events").delete().eq("id", eventId);
      if (inboundId) await service.from("inbound_emails").delete().eq("id", inboundId);
      if (organizationId) await service.from("organizations").delete().eq("id", organizationId);
    }
  }, 120_000);
});
