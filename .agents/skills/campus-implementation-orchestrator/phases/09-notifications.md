# Phase 9 — Notifications

## Objective
Create in-app notifications for participation and event lifecycle changes.

## Required notification types
- new request
- request accepted
- request rejected
- event updated
- event cancelled
- event reminder

Use notifications:
id, user_id, event_id, type, title, message, is_read, created_at.

## Acceptance criteria
- Organizer receives a new-request notification.
- Participant receives accepted/rejected notification.
- Event updates/cancellations can create notifications.
- Notification reads are protected by user ownership.
- Existing Luma visual patterns are reused.
