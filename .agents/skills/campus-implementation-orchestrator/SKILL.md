---
name: campus-implementation-orchestrator
description: >
  Orchestrate a long-running campus Luma implementation from a master specification.
  Use when implementing the Campus Luma clone + campus email intelligence project.
  Execute exactly one phase at a time, validate with objective checks, repair failures,
  protect the existing Luma UI, persist progress in implementation-state.json, and
  advance only after the current phase passes all gates.
---

# Campus Implementation Orchestrator

## Mission

Turn the master Campus Luma specification into a controlled, resumable implementation.

The master specification is:
`references/MASTER_REQUIREMENTS.md`

Never attempt the entire project in one unstructured pass.

## Operating loop

For every phase:

1. Read `implementation-state.json`.
2. Read the current phase file from `phases/`.
3. Inspect the repository before editing.
4. Implement ONLY the current phase.
5. Run the repository's relevant formatter, typecheck, lint, unit/integration tests, and build when available.
6. Run the current phase validator from `validators/`.
7. Run the UI regression gate for any phase that can affect UI.
8. If any gate fails:
   - keep the phase status `blocked`
   - record exact failures and evidence
   - fix the current phase
   - rerun validation
   - do NOT advance
9. If every gate passes:
   - record evidence
   - mark the phase `passed`
   - advance to the next phase
10. Update the state file before ending the turn.

## Non-negotiable rules

- The existing Luma clone UI is the visual source of truth.
- Do not redesign existing screens.
- Reuse existing components, styles, layouts, routing, Supabase utilities, and event/calendar UI where possible.
- Do not migrate frameworks.
- Do not introduce a new component library unless the repository already uses it.
- Do not expose Supabase service-role keys or Resend API keys.
- Do not trust client-provided ownership, role, organizer, user ID, or request status.
- Do not weaken, delete, or rewrite acceptance tests merely to make a phase pass.
- Do not mark a phase passed without concrete evidence.
- Do not continue after a failed gate.
- Do not make unrelated cleanup changes.
- Prefer small, reversible changes.
- Preserve the working architecture unless a requirement explicitly requires a change.

## State machine

Valid phase statuses:

`pending -> in_progress -> blocked -> in_progress -> passed`

A phase may also become `skipped` ONLY if the master specification explicitly makes it optional and the reason is recorded.

Never skip a required phase.

## Required state fields

Maintain:

- project
- status
- current_phase
- current_phase_name
- started_at
- updated_at
- phases[]
- blockers[]
- decisions[]
- validation_history[]
- last_summary

Each phase entry must contain:

- id
- name
- status
- attempts
- started_at
- completed_at
- implementation_evidence
- validation_evidence
- failures
- files_changed

## Baseline protection

Phase 0 establishes the existing application baseline.

Create and maintain:

`.codex/campus-baseline/`

with:

- routes.md
- components.md
- architecture.md
- commands.md
- ui-invariants.md

If screenshots are feasible, preserve baseline screenshots in:
`.codex/campus-baseline/screenshots/`

Do not invent visual invariants. Derive them from the actual repository.

## UI regression gate

For every UI-affecting phase, compare before/after behavior and visuals.

At minimum verify:

- homepage
- navigation
- event cards
- event detail
- calendar
- authentication screens
- responsive behavior

Use existing screenshots, browser tooling, component tests, or DOM/style inspection available in the repository.

A functional change is not permission to redesign.

## Validation contract

A phase passes only when all applicable checks pass:

1. Phase acceptance criteria
2. Typecheck
3. Lint/format
4. Relevant tests
5. Build
6. Security checks when applicable
7. UI regression when applicable
8. No secret leakage
9. No unexplained unrelated modifications

If a command does not exist, discover the repository's equivalent. Do not invent a successful result.

## Failure report

When blocked, record:

```text
PHASE: <id> <name>
STATUS: BLOCKED

FAILURES:
- <specific failure>

EVIDENCE:
- <command/file/test>

REQUIRED FIX:
- <specific implementation change>

DO NOT ADVANCE.
```

## Completion

The project is complete only when all required phases are `passed` and final gates pass:

- full test suite
- production build
- security/RLS verification
- UI regression verification
- email ingestion fixtures
- AI extraction fixtures
- duplicate/update fixtures
- student join flow
- end-to-end flow
- Vercel deployment readiness

## First invocation

If `implementation-state.json` does not exist:

1. Read `references/MASTER_REQUIREMENTS.md`.
2. Create the state file with all phases pending.
3. Run Phase 0.
4. Do not jump directly to feature implementation.

If a root `AGENTS.md` already exists, preserve it and add only the minimum campus-orchestrator rules needed. Never overwrite user-authored instructions.
