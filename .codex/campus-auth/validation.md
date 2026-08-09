# Phase 2 authentication validation

## Implemented behavior

- Existing Luma sign-in, OTP, profile-completion, header, and user-menu visuals are preserved.
- Email sign-in uses `supabase.auth.signInWithOtp`; both six-digit email OTP and token-hash callback flows are supported.
- Browser and server clients use `@supabase/ssr`, with sessions stored/refreshed through cookies rather than local storage.
- `/home`, `/create`, `/settings`, and `/finish-signup` (including descendants) are middleware-protected.
- Authenticated users are redirected away from `/signin`; unauthenticated users retain their intended protected destination in `next`.
- Logout calls Supabase, clears only obsolete auth cache keys, redirects to sign-in, and refreshes the router.
- The profile image action derives the user from the server session and returns HTTP 401 before body processing when unauthenticated.
- Malformed/expired callback links return safely to the existing sign-in UI and display an error toast.
- Legacy client-trusted JWT, OTP, and user-mutation endpoints were removed.

## Objective evidence

- 16 unit/contract tests cover normalized OTP requests, provider errors, OTP verification, session user restoration, metadata updates, logout errors, protected path classification, and unauthenticated action rejection.
- Runtime without Supabase credentials: public/sign-in/verification routes return 200; protected routes return 307 to `/signin?next=...`; invalid callbacks return 307 to sign-in with a safe error.
- Production build, standalone typecheck, lint, diff integrity, and public/server environment-name scan pass.
- Headless Chrome captures at 1440 x 1000 and 390 x 844 are stored under `ui-regression/`. Desktop sign-in remains visually equivalent to Phase 0. The narrow-screen fixed-width card overflow is existing styling behavior and was not redesigned in this phase.

## External configuration

Live email delivery requires real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values and a Supabase email template that exposes the OTP token when the six-digit screen is used. Values are intentionally absent from the repository; `.env.example` contains names only. The service-role key is neither used nor referenced by client code in this phase.

