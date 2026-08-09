import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve("supabase/migrations/20260809083000_duplicate_update_detection.sql"), "utf8");
const normalized = sql.replace(/\s+/g, " ").toLowerCase();

describe("duplicate/update database contract", () => {
  it("prevents two events for one inbound message", () => {
    expect(normalized).toContain("create unique index events_inbound_email_unique_idx");
    expect(normalized).toContain("on public.events (inbound_email_id)");
  });

  it("links proposals to the preserved event identity and records history", () => {
    expect(normalized).toContain("proposed_update_for_event_id uuid references public.events(id)");
    expect(normalized).toContain("create table public.event_history");
    expect(normalized).toContain("previous_data jsonb");
    expect(normalized).toContain("new_data jsonb");
  });

  it("locks proposal and target while applying a decision", () => {
    expect((normalized.match(/for update/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(normalized).toContain("where id = target.id returning * into result");
    expect(normalized).toContain("where id = proposal.id returning * into result");
  });

  it("allows only database-authorized admins to resolve proposals", () => {
    expect(normalized).toContain("not public.is_admin()");
    expect(normalized).toContain("revoke all on function public.resolve_event_proposal");
    expect(normalized).toContain("grant execute on function public.resolve_event_proposal");
  });

  it("supports apply update, create new, and reject outcomes", () => {
    for (const decision of ["apply_update", "create_new", "reject"]) {
      expect(normalized).toContain(`'${decision}'`);
    }
    expect(normalized).toContain("title = proposal.title");
    expect(normalized).toContain("status = 'published'");
    expect(normalized).toContain("status = 'rejected'");
  });
});
