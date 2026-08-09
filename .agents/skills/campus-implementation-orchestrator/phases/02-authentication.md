# Phase 2 — Authentication

## Objective
Implement Supabase Auth using the existing Luma authentication UI.

## Implementation
- Reuse the existing login UI.
- Implement email login using Supabase Auth.
- Preserve session across refresh.
- Implement logout.
- Protect authenticated actions/routes.
- Handle loading, session restoration, and auth errors.
- Use the repository's existing Supabase client conventions.
- Do not expose service-role credentials.

## Acceptance criteria
- Login works.
- Logout works.
- Session restoration works.
- Protected actions reject unauthenticated users.
- Existing login UI remains visually equivalent.
- Auth errors are handled without crashes.
