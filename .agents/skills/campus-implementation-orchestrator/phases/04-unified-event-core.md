# Phase 4 — Unified Event Core

## Objective
Implement one event model for official and student-created activities.

## Required
event_type:
- official
- solo

source:
- email
- student
- admin

categories:
- hackathon
- conference
- workshop
- seminar
- competition
- club_activity
- career_placement
- social
- sports
- study
- networking
- cultural
- other
- unknown

status:
- draft
- pending_review
- published
- rejected
- cancelled
- completed

Also support content_type:
- event
- deadline
- announcement
- opportunity
- other

Preserve source_email, organizer, dates/times/timezone, location, meeting URL, registration fields, confidence score, and publication timestamps as required by the master specification.

## Acceptance criteria
- Official and solo records share the same events table and core event detail model.
- Ownership is enforced.
- Unknown category is valid.
- Placement/career records are not discarded.
- Event CRUD is covered by tests.
