# Phase 14 — Duplicate and Update Detection Validation

Result: PASS (attempt 4)

## Behavior

- Reprocessing one inbound message returns its existing event; a cloud unique partial index prevents two events from sharing one inbound email.
- Candidate lookup is scoped to the same verified organization or exact unknown-sender address, then uses normalized title, date proximity, registration URL, and field equality.
- Exact reminder fixtures are suppressed and linked to the existing event in inbound extraction metadata.
- Likely update fixtures create a non-public `pending_review` proposal linked to the existing event.
- Admin review presents Old/New values and Apply Update, Create New, and Reject controls.
- The locked database function checks `is_admin()`, row-locks proposal and target, preserves the target event ID when applying changes, and writes previous/new JSON snapshots to `event_history`.

## Checks

- `npm test`: PASS — 25 files passed, one opt-in live Groq file skipped; 131 tests passed and one skipped.
- Duplicate fixtures: exact reminder, moved date/time, matching registration URL, unrelated event, normalization — PASS.
- Proposal UI and database contract tests — PASS.
- `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check`, and anchored secret scan — PASS; only seven documented baseline warnings remain.
- `npx supabase db push --dry-run`: PASS; identified only migration `20260809083000`.
- `npx supabase db push`: PASS; applied only the duplicate/update migration to cloud Supabase.
- Final `npx supabase migration list`: PASS; all five local and remote versions match.
- No Docker, local Supabase service, CI/CD, or downloaded image was used.

## Repaired failures

- Attempt 1: typed event fixtures lacked the new proposal-link field.
- Attempt 2: the AI persistence contract required a single visible status variable for status and publication timestamp.
- Attempt 3: one deep-equality event fixture still lacked the proposal-link field.
