# Integration and validation plan

## Architecture choices

- Keep Next.js App Router and Vercel route handlers as the application/backend boundary.
- Use Supabase Auth, PostgreSQL, RLS, database functions, and Storage. Add reproducible SQL under `supabase/migrations/`; do not require dashboard-created schema.
- Keep existing Prisma code untouched until Supabase-backed paths replace its responsibilities. Do not expand Prisma as a second campus data model.
- Use a server-only Supabase client for session-scoped writes and a separately named admin client only for verified webhooks/admin jobs.
- Use Resend from server modules. Verify inbound webhook signatures before any trusted processing.
- Run AI extraction from a server module after durable raw-email storage. The provider/model remains configurable; extraction must be strict and fixture-tested.
- Prefer database transactions/functions for authorization- and capacity-sensitive operations.
- Supabase Edge Functions are not currently required. A Vercel cron route may handle reminders later; choose an Edge Function only if runtime or scheduling constraints make it necessary.

## Existing environment convention

The project uses uppercase keys in root `.env`, which is ignored by Git. New keys should follow that convention:

- Browser-safe: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `NEXT_PUBLIC_APP_URL`.
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESEND_FROM_EMAIL`, AI provider key/model, and cron secret if used.
- Existing server-only keys remain server-only until retired: database, JWT, SMTP, Cloudinary secret, and Unsplash keys.

No secret may be interpolated into client code, returned by an API, logged, or placed in `.env.example` with a value.

## Validation commands

Commands and Phase 1 validated status:

- Development: `npm run dev` — works.
- Production build: `npm run build` — passes after shared token helpers were moved out of the route module.
- Typecheck: `npx tsc --noEmit` — passes after React type packages were aligned with React 18.
- Lint: `npm run lint` — passes non-interactively after adding the Next ESLint configuration and resolving existing errors; non-blocking warnings are recorded in validation evidence.
- Tests: none configured.

Phase 1 repaired the three initial tooling blockers without changing application behavior. Later phases add unit/integration/E2E scripts without weakening checks.

Every phase records exact command, exit status, relevant tests, build status, changed files, security impact, and UI comparison when applicable.

## UI regression-sensitive files

Highest sensitivity:

- `src/app/page.tsx`, `src/app/home.css`, `src/app/globals.css`
- `src/components/Header.tsx`, `Footer.tsx`, `Background/RandomBg.tsx`, `LumaLogo.tsx`
- `src/app/signin/page.tsx`, `src/components/SignIn/*`
- `src/app/create/page.tsx`, `src/components/CreateEvent/*`
- `src/app/settings/page.tsx`, `src/components/Settings/*`
- `src/app/layout.tsx`, `src/app/providers.tsx`, `tailwind.config.ts`

New event/card/detail/calendar/admin components must be compared to these sources and Phase 0 screenshots. Existing desktop and mobile clipping or incomplete routes are recorded defects, not permission to redesign.
