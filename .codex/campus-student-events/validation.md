# Phase 7 student-created activity validation

## Result

PASS

The existing `/create` image-picker and Personal Calendar form were extended into a responsive student-activity form. It supports title, description, category, start/end, timezone, physical/online/hybrid location, capacity, optional cloud cover URL, and join-request approval.

The authenticated `POST /api/events` boundary:

- verifies the Supabase user server-side;
- rejects unauthenticated and malformed requests;
- fixes the lifecycle state to `published` for discovery;
- strips client attempts to set organizer, event type, source, or organization;
- delegates to the shared repository, which fixes `event_type=solo`, `source=student`, and `organizer_user_id=user.id` and nulls institutional fields;
- returns safe database/network errors;
- accepts only HTTP(S) event URLs.

## Commands and evidence

- `npm test`: PASS; 10 files, 64 tests. New checks cover unauthenticated creation, authenticated owner binding, spoof stripping, input rejection, safe database failure, URL protocol safety, and server-rendered presence of the reused form/lifecycle fields.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with the same seven documented baseline warnings.
- `npm run build`: PASS; `/api/events` is a dynamic route and `/create` builds successfully.
- `git diff --check`: PASS.
- The existing published-event repository and dynamic discovery/calendar/home routes make successfully created activities visible to another authenticated user under RLS.
- The cloud project remains unlinked, so no unidentified remote user/event was created. Docker/local Supabase, local image assets, and CI/CD were not used.

## Files changed

- `src/app/api/events/route.ts`
- `src/app/create/page.tsx`
- `src/components/CreateEvent/EventForm/EventForm.tsx`
- `src/lib/events/schema.ts`
- `tests/events/event-core.test.ts`
- `tests/events/student-create-route.test.ts`
- `tests/events/student-create-form.test.ts`
- `.codex/campus-student-events/validation.md`

Security-sensitive change: added an authenticated event-creation endpoint. Ownership and event classification are derived server-side and remain independently enforced by database RLS/constraints.
