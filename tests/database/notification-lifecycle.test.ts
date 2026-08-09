import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const foundation = readFileSync(resolve("supabase/migrations/20260809063000_campus_foundation.sql"), "utf8").replace(/\s+/g, " ").toLowerCase();
const decisions = readFileSync(resolve("supabase/migrations/20260809070000_harden_solo_event_requests.sql"), "utf8").replace(/\s+/g, " ").toLowerCase();
const lifecycle = readFileSync(resolve("supabase/migrations/20260809073000_notification_lifecycle.sql"), "utf8").replace(/\s+/g, " ").toLowerCase();

describe("notification lifecycle", () => {
  it("supports every required notification type", () => {
    for (const type of ["new_request", "request_accepted", "request_rejected", "event_updated", "event_cancelled", "event_reminder"]) {
      expect(foundation).toContain(`'${type}'`);
    }
  });

  it("notifies the organizer after a new request", () => {
    expect(lifecycle).toContain("create trigger event_requests_notify_organizer after insert");
    expect(lifecycle).toContain("e.organizer_user_id");
    expect(lifecycle).toContain("'new_request'");
  });

  it("notifies the participant after accepted and rejected decisions", () => {
    expect(decisions).toContain("target_request.user_id");
    expect(decisions).toContain("'request_accepted'");
    expect(decisions).toContain("'request_rejected'");
  });

  it("notifies only accepted participants of event updates and cancellations", () => {
    expect(lifecycle).toContain("'event_updated'");
    expect(lifecycle).toContain("'event_cancelled'");
    expect(lifecycle).toContain("r.status = 'accepted'");
    expect(lifecycle).toContain("after update on public.events");
  });

  it("restricts reminder creation to admin or service callers", () => {
    expect(lifecycle).toContain("create_event_reminder");
    expect(lifecycle).toContain("auth.role() <> 'service_role' and not public.is_admin()");
    expect(lifecycle).toContain("grant execute on function public.create_event_reminder(uuid) to authenticated, service_role");
  });

  it("protects reads and read-state updates by user ownership", () => {
    expect(foundation).toContain("notifications_select_own");
    expect(foundation).toContain("notifications_update_own");
    expect(foundation).toContain("user_id = auth.uid()");
    expect(foundation).toContain("notifications_protect_fields");
    const api = readFileSync(resolve("src/app/api/notifications/route.ts"), "utf8");
    expect(api).toContain('.eq("user_id", user.id)');
  });
});
