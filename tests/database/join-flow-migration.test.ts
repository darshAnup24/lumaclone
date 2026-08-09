import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const foundation = readFileSync(
  resolve("supabase/migrations/20260809063000_campus_foundation.sql"),
  "utf8",
).replace(/\s+/g, " ").toLowerCase();
const hardening = readFileSync(
  resolve("supabase/migrations/20260809070000_harden_solo_event_requests.sql"),
  "utf8",
).replace(/\s+/g, " ").toLowerCase();

describe("join request database enforcement", () => {
  it("prevents duplicate event/user request records", () => {
    expect(foundation).toContain(
      "constraint event_requests_event_user_unique unique (event_id, user_id)",
    );
  });

  it("allows requests only for another student's published solo activity", () => {
    expect(hardening).toContain("e.event_type = 'solo'");
    expect(hardening).toContain("e.status = 'published'");
    expect(hardening).toContain("e.organizer_user_id is distinct from auth.uid()");
    expect(hardening).toContain("user_id = auth.uid()");
    expect(hardening).toContain("status = 'pending'");
  });

  it("locks the request and event before an organizer decision", () => {
    expect(hardening.match(/for update/g)).toHaveLength(2);
    expect(hardening).toContain("target_request.status <> 'pending'");
    expect(hardening).toContain("target_event.event_type <> 'solo'");
    expect(hardening).toContain("only the organizer can respond");
    expect(hardening).toContain("event is not accepting responses");
  });

  it("enforces capacity in the database while the event row is locked", () => {
    expect(hardening).toContain("status = 'accepted'");
    expect(hardening).toContain("accepted_count >= target_event.capacity");
    expect(hardening).toContain("event capacity reached");
  });

  it("exposes only the decision function to authenticated callers", () => {
    expect(hardening).toContain("security definer");
    expect(hardening).toContain("revoke all on function public.respond_to_event_request");
    expect(hardening).toContain("grant execute on function public.respond_to_event_request");
    expect(hardening).toContain("to authenticated");
  });
});
