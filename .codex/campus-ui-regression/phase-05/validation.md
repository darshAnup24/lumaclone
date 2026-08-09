# Phase 5 UI regression validation

Validated on 2026-08-09 against the Phase 0 Luma baseline.

## Result

PASS

The existing Luma shell is preserved and Supabase-backed published events now feed the authenticated home, discovery, calendar, and event-detail routes. Official and solo/student records use the same components and navigation.

## Objective checks

- `npm test`: PASS after repair; 7 files and 48 tests. Coverage includes published-only repository queries, validated event records, official/student discovery filters, date/location fallbacks, calendar grouping, real detail links, and the same rendered card for official and solo events.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with the seven previously documented non-blocking baseline warnings only.
- `npm run build`: PASS. `/home`, `/discover`, and `/calendars` are dynamic server routes so newly published cloud records do not require a rebuild; `/events/[id]` is dynamic.
- `git diff --check`: PASS.
- Runtime route smoke: `/` and `/signin` return 200. With cloud Supabase public keys intentionally absent, `/home`, `/discover`, `/calendars`, and `/events/[id]` correctly return 307 to `/signin?next=...`.
- Cloud behavior: data loaders use the session-aware Supabase SSR client, show a non-crashing empty/configuration state when the project is not configured, and show a temporary-unavailable state on query/validation failure.
- No Docker, local Supabase runtime, CI/CD, seed mutation, or cloud database mutation was performed.

## Regression evidence

- Current captures: `homepage-desktop.png`, `homepage-mobile.png`, and `signin-desktop.png` in this directory.
- Manual side-by-side inspection against `.codex/campus-baseline/screenshots/` confirmed the same hierarchy, geometry, navigation, auth card, desktop layout, and documented mobile clipping. Live clock, video frame, and ambient-gradient pixels are expected to differ.
- ImageMagick normalized RMSE: homepage desktop `0.0421002`, homepage mobile `0.026633`, sign-in desktop `0.00965588`. Visual inspection attributes these differences to the live surfaces above; no Phase 5 code changed the public homepage or sign-in UI.
- New surfaces derive from the baseline zinc palette, border weights, translucent/backdrop-blur panels, rounded geometry, Inter typography, Lucide icons, existing `Header`, and `RandomBg`. Responsive cards use 1/2/3 columns, calendar rows stack below `sm`, filter chips scroll rather than overflow, and detail content collapses to one column below `md`.

## Failed checks and repairs

1. The first component-render regression run failed because Vitest 4's active OXC transformer inherited `jsx: preserve` and passed TSX to import analysis. Phase 5 did not advance. `vitest.config.mts` now explicitly uses the automatic JSX runtime; the full suite passed on revalidation.
2. The first successful production build identified `/home` and `/calendars` as static when cloud keys were absent at build time. Those event-backed routes, plus discovery, were forced dynamic; the final build reports all three as dynamic.

## Phase files

- `src/app/home/page.tsx`
- `src/app/discover/page.tsx`
- `src/app/calendars/page.tsx`
- `src/app/events/[id]/page.tsx`
- `src/components/Events/EventCard.tsx`
- `src/components/Events/EventCollection.tsx`
- `src/components/Events/EventShell.tsx`
- `src/lib/events/load.ts`
- `src/lib/events/presentation.ts`
- `src/lib/events/repository.ts`
- `src/lib/supabase/middleware.ts`
- `tests/auth/protected-routes.test.ts`
- `tests/events/event-card.test.ts`
- `tests/events/event-presentation.test.ts`
- `vitest.config.mts`

Security-sensitive change: the newly implemented authenticated event routes were added to the existing middleware protection list. No secret or privileged Supabase client was added; the relevant source/test scan found no service-role or credential literals.
