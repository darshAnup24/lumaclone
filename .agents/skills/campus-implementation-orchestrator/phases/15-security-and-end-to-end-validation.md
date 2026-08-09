# Phase 15 — Security and End-to-End Validation

## Objective
Validate the complete product and security model before deployment.

## Run
- full test suite
- typecheck
- lint/format
- production build
- RLS tests
- authorization tests
- email fixtures
- AI extraction fixtures
- duplicate/update fixtures
- student create/request/accept flow
- inbound email -> review -> publish -> calendar flow

## Explicit abuse tests
Attempt to:
- edit another user's event
- alter organizer_user_id
- accept own request
- accept someone else's request
- modify another user's notification
- publish an inbound record without admin authorization
- change organization verification
- expose service-role or Resend secrets

## Acceptance criteria
Every required flow passes and every unauthorized operation is rejected.
