# Phase 3 — Database Foundation

## Objective
Create reproducible Supabase PostgreSQL migrations and security foundations.

## Required tables
- profiles
- organizations
- events
- event_requests
- notifications
- inbound_emails
- optionally organization_followers and user_interests when appropriate

## Required
- primary/foreign keys
- unique constraints
- indexes
- timestamps
- event status/type/source/category fields
- reproducible SQL migrations
- RLS policies
- server-side/admin authorization foundations

## Security requirements
Users must not modify another user's events or requests, accept their own request, alter ownership, publish inbound email records, or change organization verification.

## Acceptance criteria
- A clean database reset can reproduce the schema.
- RLS is enabled where required.
- Authorization is enforced server-side/database-side.
- Required constraints and indexes exist.
- Secrets are never stored in client code.
