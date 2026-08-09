# Phase 3 database foundation validation

## Cloud-first constraint

Per user instruction, local Docker/Supabase services and CI are not used. `supabase start` was stopped during its initial image pull and must not be used for this project. The checked-in CLI configuration exists only to support cloud linking and `supabase db push` when project credentials are configured.

This checkout currently has no Supabase project link metadata or `NEXT_PUBLIC_SUPABASE_*` values, so the migration was not applied to an unidentified remote database. Applying/resetting cloud state without an explicit target would be unsafe.

## Reproducible foundation

The ordered migration creates:

- profiles linked to `auth.users`, automatic profile bootstrap, protected role/email fields, and admin authorization helper;
- verified organizations with sender patterns;
- durable inbound emails with extraction/error/attachment metadata;
- the unified event model and complete enums/constraints/indexes;
- unique join requests, notifications, organization followers, and user interests;
- timestamp triggers and immutable ownership/identity fields;
- RLS on all eight public tables;
- public published-event/verified-organization reads, owner-scoped student writes, admin-only institutional/email writes, and user-scoped private data;
- a security-definer request response function that locks rows, verifies organizer identity, rejects self-response, checks event state/capacity, and creates the participant notification.

## Non-Docker validator

The database contract test reads the exact migration artifact and asserts every required table, RLS enablement, taxonomy, key constraints, indexes, privileged-field triggers, admin-only policies, self-request defense, absence of direct organizer status mutation, locked capacity-aware response function, and secret absence.

For first cloud application, run only after linking the intended Supabase project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
```

Then execute the same unauthorized-operation scenarios against a disposable/test branch before production traffic. No automatic cloud mutation or CI workflow is added.

