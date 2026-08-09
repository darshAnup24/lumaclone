# Phase 13 — Admin Review

## Objective
Create an admin review workflow using existing Luma visual patterns.

## Admin can review/edit
- title
- description
- category
- organizer
- date/time/timezone
- location
- registration URL/deadline
- event type
- extracted fields

## Required states
pending_review, published, rejected.

Unknown category must be editable before publication.

## Security
Only authorized admins can publish/reject/edit inbound-derived records.

## Acceptance criteria
- Extracted records do not become public automatically in MVP.
- Admin can edit and publish.
- Admin can reject.
- Unknown/ambiguous records are reviewable.
- Admin controls are server-side protected.
