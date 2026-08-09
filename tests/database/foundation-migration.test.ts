import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  "supabase/migrations/20260809063000_campus_foundation.sql",
);
const sql = readFileSync(migrationPath, "utf8");
const normalized = sql.replace(/\s+/g, " ").toLowerCase();

const requiredTables = [
  "profiles",
  "organizations",
  "events",
  "event_requests",
  "notifications",
  "inbound_emails",
  "organization_followers",
  "user_interests",
];

describe("campus foundation migration", () => {
  it.each(requiredTables)("creates %s with RLS enabled", (table) => {
    expect(normalized).toContain(`create table public.${table}`);
    expect(normalized).toContain(
      `alter table public.${table} enable row level security`,
    );
  });

  it("defines the complete event taxonomy and source/status fields", () => {
    expect(normalized).toContain("create type public.event_type as enum ('official', 'solo')");
    expect(normalized).toContain("create type public.event_source as enum ('email', 'student', 'admin')");
    for (const category of [
      "hackathon",
      "conference",
      "workshop",
      "career_placement",
      "study",
      "networking",
      "unknown",
    ]) {
      expect(normalized).toContain(`'${category}'`);
    }
    for (const status of [
      "draft",
      "pending_review",
      "published",
      "rejected",
      "cancelled",
      "completed",
    ]) {
      expect(normalized).toContain(`'${status}'`);
    }
  });

  it("defines ownership, duplicate, range, and time constraints", () => {
    for (const constraint of [
      "event_requests_event_user_unique",
      "events_capacity_positive",
      "events_confidence_range",
      "events_time_order",
      "events_student_shape",
      "events_email_shape",
      "events_published_timestamp",
    ]) {
      expect(normalized).toContain(`constraint ${constraint}`);
    }
  });

  it("indexes discovery, ownership, sender, request, and notification paths", () => {
    for (const index of [
      "events_public_discovery_idx",
      "events_category_idx",
      "events_organizer_idx",
      "events_organization_idx",
      "inbound_emails_status_received_idx",
      "inbound_emails_sender_idx",
      "event_requests_event_status_idx",
      "event_requests_user_status_idx",
      "notifications_user_unread_idx",
    ]) {
      expect(normalized).toContain(`index ${index}`);
    }
  });

  it("prevents client ownership and privileged-field mutation", () => {
    expect(normalized).toContain("create trigger profiles_protect_privileged_fields");
    expect(normalized).toContain("new.role := old.role");
    expect(normalized).toContain("create trigger events_protect_ownership");
    expect(normalized).toContain("new.organizer_user_id := old.organizer_user_id");
    expect(normalized).toContain("create trigger event_requests_protect_identity");
    expect(normalized).toContain("new.user_id := old.user_id");
    expect(normalized).toContain("create trigger notifications_protect_fields");
  });

  it("restricts institutional records to admins and student events to their owner", () => {
    expect(normalized).toContain("create policy organizations_admin_update");
    expect(normalized).toContain("create policy inbound_emails_admin_insert");
    expect(normalized).toContain("create policy inbound_emails_admin_update");
    expect(normalized).toContain("organizer_user_id = auth.uid()");
    expect(normalized).toContain("event_type = 'solo'");
    expect(normalized).toContain("source = 'student'");
  });

  it("rejects self-requests and direct organizer acceptance", () => {
    expect(normalized).toContain("e.organizer_user_id is distinct from auth.uid()");
    expect(normalized).toContain("create policy event_requests_requester_cancel");
    expect(normalized).not.toContain("create policy event_requests_organizer_update");
    expect(normalized).toContain("organizers cannot accept their own request");
  });

  it("serializes request decisions and enforces capacity in a server-side function", () => {
    expect(normalized).toContain("create or replace function public.respond_to_event_request");
    expect(normalized).toContain("for update");
    expect(normalized).toContain("accepted_count >= target_event.capacity");
    expect(normalized).toContain("only the organizer can respond");
    expect(normalized).toContain("revoke all on function public.respond_to_event_request");
  });

  it("keeps service credentials out of the migration", () => {
    expect(sql).not.toMatch(/supabase_service_role_key\s*=/i);
    expect(sql).not.toMatch(/resend_api_key\s*=/i);
  });
});
