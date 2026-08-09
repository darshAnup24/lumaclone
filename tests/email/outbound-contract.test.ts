import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const notifications = readFileSync(resolve("src/lib/email/notifications.ts"), "utf8");
const requestRoute = readFileSync(resolve("src/app/api/events/[id]/requests/route.ts"), "utf8");
const decisionRoute = readFileSync(resolve("src/app/api/event-requests/[id]/route.ts"), "utf8");
const updateRoute = readFileSync(resolve("src/app/api/events/[id]/route.ts"), "utf8");
const reminderRoute = readFileSync(resolve("src/app/api/events/[id]/reminder/route.ts"), "utf8");
const migration = readFileSync(resolve("supabase/migrations/20260809080000_outbound_email_logs.sql"), "utf8").replace(/\s+/g, " ").toLowerCase();

describe("transactional outbound email contract", () => {
  it("wires every required email to its server-side transaction", () => {
    expect(requestRoute).toContain("emailOrganizerOfNewRequest(eventId)");
    expect(decisionRoute).toContain("emailParticipantOfDecision");
    expect(updateRoute).toContain('"event_updated"');
    expect(reminderRoute).toContain('"event_reminder"');
    expect(reminderRoute).toContain("create_event_reminder");
  });

  it("targets attendees rather than broadcasting users", () => {
    expect(notifications).toContain('.from("event_requests")');
    expect(notifications).toContain('.eq("event_id", eventId)');
    expect(notifications).toContain('.eq("status", "accepted")');
    expect(notifications).not.toContain('.from("profiles").select("id,email")');
  });

  it("records useful delivery status and errors under service access", () => {
    expect(migration).toContain("create table public.outbound_email_logs");
    expect(migration).toContain("provider_message_id");
    expect(migration).toContain("error_message");
    expect(migration).toContain("status in ('sent', 'failed', 'skipped')");
    expect(migration).toContain("enable row level security");
    expect(notifications).toContain('.from("outbound_email_logs").insert');
  });

  it("keeps Resend keys server-only", () => {
    const sources = [notifications, readFileSync(resolve("src/lib/email/resend.ts"), "utf8")].join("\n");
    expect(sources).toContain("process.env.RESEND_API_KEY");
    expect(sources).not.toContain("NEXT_PUBLIC_RESEND");
  });
});
