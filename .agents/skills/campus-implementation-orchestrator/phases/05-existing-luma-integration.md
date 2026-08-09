# Phase 5 — Existing Luma Integration

## Objective
Connect Supabase-backed events to the existing Luma event/calendar/discovery UI without redesign.

## Implementation
- Replace only the minimum mock/static data needed to load real events.
- Reuse existing event cards, event detail pages, calendar components, filters, navigation, forms, and responsive behavior.
- Support official and solo events in the same UI.
- Add filters only by extending existing filter mechanisms.
- Preserve existing visual hierarchy and interaction patterns.

## Acceptance criteria
- Published events appear in the existing calendar/discovery UI.
- Event detail works from real data.
- Existing pages remain visually equivalent.
- Mobile/responsive behavior is preserved.
- No new design system or component library is introduced.
