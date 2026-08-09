# Phase 1 — Repository Audit

## Objective
Produce a concrete implementation map without rewriting the existing architecture.

## Implementation
- Read the master requirements.
- Map each requirement to existing files/modules or new modules.
- Identify reusable Supabase/auth/event/calendar utilities.
- Identify exact commands for lint, typecheck, tests, build, and local development.
- Identify integration points for Vercel/server routes and Supabase Edge Functions.
- Identify existing environment-variable conventions.
- Identify likely UI regression-sensitive components.
- Record unresolved assumptions instead of silently guessing.

## Acceptance criteria
- Every required product area has an implementation location.
- Existing functionality that can be reused is explicitly identified.
- No unnecessary architectural migration is proposed or performed.
- A phase-by-phase dependency map exists.
