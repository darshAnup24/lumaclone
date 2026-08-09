# Campus Implementation Orchestrator

When the `campus-implementation-orchestrator` skill is active:

- Treat `references/MASTER_REQUIREMENTS.md` as the product specification.
- Execute only the current phase from `.agents/skills/campus-implementation-orchestrator/phases/`.
- Never advance until the current phase validator passes.
- Preserve the existing Luma UI as the visual source of truth.
- Run objective tests, build, typecheck, and lint where available.
- Never weaken tests or acceptance criteria to obtain a pass.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY`.
- Persist progress in `implementation-state.json` and resume from it after interruption.
