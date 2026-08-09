# Phase 10 — Resend Outbound Email

## Objective
Implement transactional outbound email using Resend.

## Required cases
- organizer: someone requested to join
- participant: request accepted
- participant: request rejected
- attendees: event updated
- attendees: reminder

Do not broadcast every new event to every user.

## Security
- RESEND_API_KEY server-side only.
- Email failures must not crash core event/request transactions.
- Record useful failure information for debugging.

## Acceptance criteria
- Outbound email service is isolated and testable.
- Transactional notifications are triggered from correct server-side events.
- No client-side secret exposure.
