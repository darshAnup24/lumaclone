# Baseline UI invariants

These invariants are derived from repository source and Phase 0 screenshots captured on 2026-08-09. They describe the current Luma clone; they are not a redesign brief.

## Global visual language

- Preserve Inter as the application font and the existing zinc neutral palette, CSS-variable themes, light/dark mode behavior, thin borders, rounded controls, and subtle translucent/backdrop-blur surfaces.
- Preserve existing Luma logos, wordmarks, iconography, landing video/media, and the radial ambient background treatment.
- Continue using Tailwind utilities and the existing Radix/shadcn primitives. Do not introduce another component library or a parallel token system.
- Preserve compact, medium-weight labels, large but restrained landing typography, and rounded-lg/rounded-2xl/rounded-3xl geometry where used by existing analogous elements.

## Navigation and landing page

- Public header: icon/wordmark at left; clock, Explore link, and pill-shaped Sign In action at right.
- Authenticated header: Luma icon plus Events, Calendars, and Discover navigation; create, search, notification, and profile actions at right. Existing small-screen visibility rules hide text selectively.
- Landing desktop: two-column hero inside the existing 1280px maximum width, left-aligned headline/description/CTA and event-phone media at right, with the existing footer below.
- Landing headline retains the two-line `Enchanting Events` text and gradient `start here` line; primary CTA remains a high-contrast rounded rectangle.
- Footer retains its thin top border, two-row link organization, muted legal text, and social icons.

## Authentication and forms

- Authentication remains a centered compact card over the ambient background, with a rounded-3xl shell, thin neutral border, translucent surface, icon disk, left-aligned copy, rounded inputs, and full-width actions.
- Existing form error color, loading spinner, email/phone switch, OTP cells, and Google-action row are visual references for future auth work.
- Settings uses a centered ~1000px content width, sticky blurred tab header, responsive stacked/grid sections, and existing tabs/dialogs/sheets rather than new navigation patterns.
- Event creation uses the existing image selection and form layout, with rounded panels, neutral translucent backgrounds, compact labels, and existing responsive grid rules.

## Responsive baseline

- Tailwind `sm`, `md`, and `lg` breakpoints drive layout and conditional navigation labels.
- The landing hero changes from row to column on narrow screens, centers text, and places media below the CTA.
- The 390 x 844 baseline screenshot contains horizontal clipping of the fixed-width hero copy and a media crop below the viewport. This is a documented pre-existing behavior, not a new target to reproduce intentionally; later changes must at minimum avoid making it worse unless a phase explicitly repairs responsive behavior.

## Feature availability at baseline

- There is no event card, event detail screen, discovery feed, or working calendar page to compare visually yet.
- Future implementations must derive those missing surfaces from the existing landing, create-event, settings, dialog, form, navigation, typography, and spacing patterns rather than inventing a separate campus visual language.
- Phase 0 screenshots are the comparison artifacts for homepage, responsive landing behavior, and authentication. Existing source is the baseline for create/settings surfaces that could not be meaningfully captured without an authenticated session.

