# Phase dependency map

The orchestrator phase files are authoritative. This map records prerequisites and deliverables; it does not permit skipping or parallel phase advancement.

| Phase | Depends on | Principal deliverable |
| --- | --- | --- |
| 0 Baseline Snapshot | None | Protected repository/UI baseline and objective starting evidence. |
| 1 Repository Audit | 0 | Requirement locations, reuse decisions, risks, assumptions, and this dependency map. |
| 2 Authentication | 1 | Supabase Auth clients/session middleware integrated into existing auth UI. |
| 3 Database Foundation | 2 | Reproducible Supabase migrations, profiles/roles, organizations, foundational RLS/functions. |
| 4 Unified Event Core | 3 | One secure event domain/table/API for official and solo events. |
| 5 Existing Luma Integration | 4 | Database-backed discovery, detail, and calendar surfaces in the existing UI language. |
| 6 Seed Official Events | 5 | Verified organizations and realistic official seed data visible through the UI. |
| 7 Student-Created Activities | 4–6 | Existing create-event UI writes secure `solo + student` events. |
| 8 Join Request and Approval Flow | 7 | Transactional, authorized request/capacity/organizer response workflow. |
| 9 Notifications | 8 | In-app transactional notifications generated from request/event changes. |
| 10 Resend Outbound Email | 9 | Server-only transactional email delivery for notification events. |
| 11 Resend Inbound Email | 3, 10 | Verified, idempotent webhook stores raw email and attachments. |
| 12 AI Event Extraction | 11 | Strict, fixture-tested extraction and date/category confidence handling. |
| 13 Admin Review | 3, 4, 12 | Secure review/edit/publish/reject pipeline using existing UI primitives. |
| 14 Duplicate and Update Detection | 11–13 | Duplicate/update candidates and explicit admin resolution. |
| 15 Security and E2E Validation | All functional phases | RLS/security tests and complete institutional + student workflow evidence. |
| 16 Vercel Deployment Readiness | 15 | Clean production build, environment/setup docs, runtime/webhook/cron readiness. |

## Critical path

`baseline → audit → auth → database/RLS → unified events → Luma UI → student flow → notifications/email → inbound email → AI → admin review → dedupe → security/E2E → deployment`

Each phase must repair its own validator failures before the next phase begins.

