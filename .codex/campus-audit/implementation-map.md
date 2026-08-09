# Campus implementation map

This map covers the product areas in `MASTER_REQUIREMENTS.md` without changing the existing Next.js architecture or Luma visual language.

## Existing assets to preserve and reuse

| Area | Existing implementation | Reuse decision |
| --- | --- | --- |
| App shell and routing | `src/app/layout.tsx`, App Router pages and route handlers | Keep Next.js App Router and add routes in the same structure. |
| Navigation and branding | `src/components/Header.tsx`, `Footer.tsx`, `LumaLogo.tsx`, `public/Luma/*` | Extend existing links/actions only when a phase requires it; retain visuals. |
| Authentication UI | `src/app/signin`, `finish-signup`, `verifyAccount`; `src/components/SignIn/*` | Preserve card/form visuals while replacing custom auth mechanics with Supabase Auth. |
| Profile/settings UI | `src/app/settings`, `src/components/Settings/*`, `UserDropdown.tsx` | Reuse for Supabase-backed profile/session/logout functionality. |
| Event creation | `src/app/create`, `src/components/CreateEvent/*` | Extend the existing form/image-selection presentation for student activities. |
| Calendar conventions | `Header` calendar link and `src/components/Calendars/CreateCalendar.tsx` | Reuse visual conventions, but a display calendar does not yet exist and must be added natively. |
| Forms and validation | React Hook Form, Zod, `src/components/ui/form.tsx` | Reuse for event, admin-review, and request forms. |
| UI primitives | `src/components/ui/*` Radix/shadcn components | Reuse dialogs, sheets, selects, tabs, toasts, inputs, and buttons; add no new UI kit. |
| Themes and styling | `globals.css`, `tailwind.config.ts`, `next-themes` | Preserve Inter, zinc palette, CSS variables, radii, spacing, breakpoints, and dark mode. |
| Localization | `src/i18n.ts`, `src/translations/{en,pt}` | Extend existing translation files for user-visible campus strings. |
| Server conventions | `src/app/api/**/route.ts`, `src/lib/db.ts` | Keep server logic in App Router handlers/modules; do not introduce a standalone backend. |

No reusable Supabase client, Supabase Auth helper, event repository, event card, event detail, event calendar, Resend utility, AI utility, admin authorization utility, or notification service exists today.

## Requirement-to-location map

| Required product area | Primary implementation locations | Notes |
| --- | --- | --- |
| Supabase browser/server clients | `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`; `src/types/database.ts` | `admin.ts` is server-only and is the sole location allowed to use the service-role key. |
| Session refresh/protection | `src/middleware.ts`, `src/lib/supabase/middleware.ts`, server helpers | Replace local-storage JWT checks with cookie-backed Supabase sessions. |
| Login/logout/restoration/errors | Existing `/signin` and SignIn components, `Header`, `UserDropdown`, protected pages | Retain existing Luma auth UI; Supabase email OTP/magic-link behavior lives underneath. |
| Profiles and secure admin role | Supabase migrations; profile queries; `src/lib/auth/require-user.ts`, `require-admin.ts` | Admin enforcement must use database/server claims/functions, never a client boolean. |
| Unified organizations/events schema | `supabase/migrations/*_campus_foundation.sql` | One `events` table with `official`/`solo`, `email`/`student`/`admin`, status/category/content-type constraints. |
| Requests, notifications, interests/follows | Same migrations plus database functions/RLS | `event_requests` unique on `(event_id,user_id)`; interests/follows remain architecture-ready but minimal. |
| Raw inbound email and attachments | Migrations, private Supabase Storage bucket migration/policy | Retain bodies, extraction JSON, errors, sender identity, message ID, and attachment metadata. |
| RLS, constraints, triggers, indexes | Reproducible SQL in `supabase/migrations/` | Ownership, capacity, accepted-count, admin publish, organization verification, timestamps, and duplicate invariants. |
| Shared event domain types/validation | `src/lib/events/types.ts`, `schema.ts`, `queries.ts`, `mutations.ts` | Normalize timestamps/URLs/categories and keep a single model for all event sources. |
| Public discovery feed | Existing `/home`; new `src/components/Events/EventCard.tsx`, `EventFilters.tsx` | Replace placeholder content without changing the existing header or global styling. |
| Event detail | `src/app/events/[id]/page.tsx`, native event detail components | Reuse existing form/card metadata patterns; public reads only published events. |
| Calendar | `src/app/calendars/page.tsx`, `src/components/Calendars/EventCalendar.tsx` | Implement using current component/style patterns; no external UI library unless already present. |
| Student event creation | Existing `/create` and `CreateEvent/EventForm` plus a server action/route | Server derives organizer from session and forces `event_type=solo`, `source=student`. |
| Join/cancel/respond flow | `src/app/api/events/[id]/requests/route.ts`, request response route/server functions, detail UI | Database/server verifies identity, ownership, state, capacity, and duplicate participation. |
| In-app notifications | `src/lib/notifications/*`, notification API/server actions, existing header notification affordance | Transactional types only for MVP; mark-read is scoped by authenticated user. |
| Resend outbound email | `src/lib/email/resend.ts`, templates, notification dispatch service | Server-only API key; failures recorded/retried without rolling back authoritative request state. |
| Resend inbound webhook | `src/app/api/webhooks/resend/route.ts`, `src/lib/email/inbound.ts` | Verify webhook signature, idempotently store by message ID, retrieve content/attachments server-side. |
| Organization mapping | `src/lib/organizations/match-sender.ts`, database sender patterns | Exact verified addresses/domain patterns; unknown senders always require review. |
| Strict AI extraction | `src/lib/ai/event-extraction.ts`, `schema.ts`, fixtures | Structured schema, relevance/content type, confidence, relative-date resolution from received time and timezone. |
| Admin review | `src/app/admin/review/page.tsx`, `src/components/Admin/EventReview*`, protected APIs/actions | View source/attachments/errors, edit all fields, publish/reject; unknown categories remain reviewable. |
| Duplicate/update detection | `src/lib/events/dedupe.ts`, `normalize.ts`; match tables/columns and admin actions | Message-ID idempotency first, then organizer/title/date/URL similarity and explicit apply/create/reject decision. |
| Seed official events | `supabase/seed.sql` or ordered seed migration | Four to five realistic future-dated official events and verified organizations. |
| Email/extraction/update fixtures | `tests/fixtures/inbound-email/*`, `tests/fixtures/extraction/*` | Hackathon, workshop, placement, conference, unknown, malformed, and reschedule cases. |
| Unit/integration/E2E tests | `tests/unit`, `tests/integration`, `tests/e2e`; later test scripts/config | Cover schemas, sender mapping, date handling, dedupe, RLS, auth, publish flow, student join flow. |
| UI regression | Baselines in `.codex/campus-baseline/screenshots`; browser tests/screenshots | Compare homepage, navigation, cards, detail, calendar, auth, and responsive behavior in every UI phase. |
| Error handling/observability | Typed server errors, `inbound_emails.error_message`, processing status, route logs | Malformed external inputs become review/failed records rather than crashing requests. |
| Environment documentation | `.env.example`, README | Public URL/anon key only in client; service role, Resend, AI, webhook secrets remain server-only. |
| README and architecture | `README.md` | Document email-to-event and student flows, setup, migrations/RLS, Resend, AI, fixtures, and Vercel. |
| Vercel readiness | `vercel.json` only if cron/config is needed; route runtime declarations; build checks | Next deployment remains the hosting model; Edge Functions are unnecessary unless a later constraint demands them. |

## Data-flow boundaries

- Browser reads permitted public/profile data through the anon client under RLS.
- Sensitive writes use server actions/route handlers with the authenticated session; client-supplied owner, user, role, organizer, and status are ignored.
- The service-role client is reserved for verified external webhooks and tightly scoped admin/server jobs.
- Resend inbound processing, AI extraction, organization verification, publishing, and outbound mail run only on the server.
- Database functions/transactions own capacity-sensitive request acceptance so concurrent requests cannot overbook an activity.

