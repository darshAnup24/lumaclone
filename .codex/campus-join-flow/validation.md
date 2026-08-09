# Phase 8 join request and approval validation

## Result

PASS

- Student request creation binds `event_id`, authenticated `user_id`, and `pending` status server-side.
- A forward migration restricts requests to another user's published `solo` activity; the existing unique `(event_id, user_id)` constraint prevents duplicates.
- Requesters can cancel only their own pending request under RLS.
- Organizer accept/reject calls only `respond_to_event_request`; no direct decision update endpoint exists.
- The database function locks both request and event, requires pending state and solo/active event, checks authenticated organizer ownership, serializes accepted-count capacity, and then records the decision.
- Event detail now exposes Request/Cancel/status controls to students and pending Accept/Decline plus accepted-capacity count to the organizer using existing Luma metadata/card styles.

## Commands

- `npm test`: PASS; 12 files, 73 tests. New tests cover unique enforcement, solo/published/self-request RLS, row locks, active state, organizer authorization, database capacity, execute grants, authenticated identity binding, duplicate conflict, RPC delegation, and safe authorization/capacity responses.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with seven documented baseline warnings.
- `npm run build`: PASS; request and decision API routes plus the enhanced event detail compile.
- `git diff --check`: PASS.
- Credential scan: PASS.
- Cloud remains unlinked; no remote mutation or local Docker/Supabase was used.

## Files changed

- `supabase/migrations/20260809070000_harden_solo_event_requests.sql`
- `src/lib/events/requests.ts`
- `src/app/api/events/[id]/requests/route.ts`
- `src/app/api/event-requests/[id]/route.ts`
- `src/components/Events/JoinRequestPanel.tsx`
- `src/app/events/[id]/page.tsx`
- `tests/database/join-flow-migration.test.ts`
- `tests/events/join-flow-route.test.ts`
- `.codex/campus-join-flow/validation.md`

Security-sensitive changes: new request/decision endpoints and a security-definer database function replacement. Both authenticate server-side; the database independently enforces identity, ownership, activity type/state, uniqueness, and capacity.
