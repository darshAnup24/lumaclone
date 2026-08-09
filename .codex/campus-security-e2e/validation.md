# Phase 15 — Security and End-to-End Validation

Result: PASS (attempt 2)

## Live cloud security test

Command:

`LIVE_SUPABASE_VALIDATION=1 node --env-file=.env node_modules/vitest/vitest.mjs run tests/security/cloud-rls-live.test.ts`

PASS in 22.6 seconds. Using four temporary authenticated users and uniquely tagged records, the test verified:

- another student cannot edit an owned event;
- an owner cannot change `organizer_user_id`;
- an organizer cannot accept their own request;
- a non-organizer cannot accept another student's request;
- the organizer can accept a valid participant request;
- another user cannot modify a notification;
- a student cannot change organization verification;
- a student cannot publish an inbound-derived event;
- a database-role admin can publish it;
- the published event is visible through RLS;
- request and acceptance notification triggers reach the intended users.

The final cleanup audit found zero synthetic security users or organizations.

## Live inbound-to-calendar test

Command:

`LIVE_E2E_VALIDATION=1 node --env-file=.env node_modules/vitest/vitest.mjs run tests/e2e/inbound-calendar-live.test.ts`

PASS in 5.3 seconds. A verified synthetic inbound email was extracted by configured Groq `openai/gpt-oss-120b`, published under the explicit confidence policy, stored in cloud Supabase, and returned by the same published-event repository used by the Luma calendar. Cleanup found zero synthetic inbound rows or organizations.

## Complete gates

- `npm test`: PASS — 25 files passed and three opt-in live files skipped; 131 tests passed and three skipped.
- `npm run lint`: PASS with seven documented baseline warnings.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- Cloud migration parity: PASS for all five migrations.
- Anchored secret-value scan: PASS.
- Final synthetic cleanup audit: PASS.

The ordinary suite covers signed inbound webhook verification/idempotency, Resend outbound delivery contracts, AI extraction fixtures, duplicate/update fixtures, admin role enforcement, student create/request/decision routes, notifications, and existing Luma event/calendar presentation.

## Repaired failure

- Attempt 1 timed out because four free-tier Auth user creations ran sequentially. The partial run left four users and one organization; those exact synthetic resources were removed and zero counts verified. Independent setup/cleanup was parallelized, and attempt 2 passed.
