# Phase 12 — AI Event Extraction

## Objective
Extract strict structured information from inbound email; do not merely summarize.

## Required extraction fields
is_relevant, content_type, title, description, organizer, category, start_time, end_time, timezone, location_type, location, meeting_url, registration_url, registration_deadline, capacity, confidence.

## Content types
event, deadline, announcement, opportunity, other.

## Rules
- Use a strict schema.
- Unknown category is valid.
- Placement/career content uses career_placement when appropriate.
- Ambiguous dates must require review.
- Relative dates are resolved using email received timestamp and timezone.
- AI must not automatically publish during initial deployment.

## Acceptance criteria
- Structured output validates against a schema.
- Fixture emails produce expected content types/categories.
- Confidence is stored.
- Extraction failures become reviewable failures.
