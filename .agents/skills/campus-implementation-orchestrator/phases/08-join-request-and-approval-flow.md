# Phase 8 — Join Request and Approval Flow

## Objective
Allow students to request participation in solo activities.

## Required
event_requests:
- event_id
- user_id
- status
- requested_at
- responded_at

Statuses:
- pending
- accepted
- rejected
- cancelled

Enforce UNIQUE(event_id, user_id).

Organizer can accept/reject only for their own active event.
Before acceptance verify:
- organizer ownership
- event not cancelled/completed
- capacity
- participant not already accepted

## Acceptance criteria
- Request flow works end-to-end.
- Duplicate requests are prevented.
- Unauthorized acceptance/rejection is impossible.
- Capacity is enforced server-side/database-side.
