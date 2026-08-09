# Phase 14 — Duplicate and Update Detection

## Objective
Prevent repeated reminders and update emails from creating duplicate events.

## Signals
- source message ID
- organizer
- normalized title
- date/time
- registration URL
- similarity where appropriate

## Update example
Original: Hackathon Aug 20, 10 AM.
Update: moved to Aug 21, 2 PM.

Detect likely existing event and present:
- old values
- new values
- Apply Update
- Create New
- Reject

## Acceptance criteria
- Exact duplicates are prevented.
- Likely duplicates are reviewable.
- Update fixtures do not blindly create a second event.
- Existing event history/identity is preserved appropriately.
