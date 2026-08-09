# Phase 6 official seed validation

## Result

PASS

- `supabase/seed.sql` reproducibly upserts four verified/official organizations and five fixed-ID, published official events.
- Events cover workshop, career/placement, hackathon, club activity, and networking discovery categories with ordered 2026 schedules, deadlines, capacities, physical locations, descriptions, and `Asia/Kolkata` timezone data.
- Seeds use no cover image or other downloaded/local media.
- The Supabase config enables `./seed.sql`; the supported cloud application path is `supabase db push --linked --include-seed`.
- The workspace is not linked to a cloud project, so no dry-run or mutation was attempted against an unidentified target. Docker/local Supabase and CI/CD were not used.
- Seeds do not add an API, function, policy, grant, auth user, service role, or client-side privileged path. Normal runtime writes remain governed by the Phase 3 RLS policies.
- Visibility follows the Phase 5 shared published-event loader used by home, discovery, and calendar; each seeded event links through the shared detail route.

## Commands

- `npx supabase db push --help`: PASS; confirmed `--linked`, `--include-seed`, and `--dry-run` support without contacting a project.
- Link presence check: PASS; reported `not-linked` without exposing a project reference.
- `npm test`: PASS; 8 files, 59 tests, including 11 seed contract checks.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with only the seven documented baseline warnings.
- `npm run build`: PASS; all event views remain dynamic.
- `git diff --check`: PASS.
- Seed credential scan: PASS.

## Files changed

- `supabase/seed.sql`
- `tests/database/official-seed.test.ts`
- `.codex/campus-seed/validation.md`

Security-sensitive changes: none. Seed setup data is privileged by design but does not alter production authorization or expose a privileged runtime write path.
