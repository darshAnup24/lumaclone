# Baseline components

Captured on 2026-08-09 from the current working tree.

## Reusable visual shell

- `Header`: shared public/authenticated navigation, icon or wordmark logo, clock, create action, search, notifications, and user menu.
- `Footer`: shared Luma wordmark, product/legal links, social links, and clone attribution.
- `RandomBg`: full-screen ambient color treatment used by the landing and authentication/settings screens.
- `LumaLogoSVG` and public files under `public/Luma/`: existing brand assets.
- `Providers`: `next-themes` and `react-i18next` providers; language is restored from local storage.

## Authentication and profile UI

- `SignIn`, `SignInForm`, `OtpLogin`, `CreateUsernameForm`, and `Welcome` provide the current email/phone OTP and signup-completion experience.
- `UserDropdown` provides profile, settings, theme, language, and logout interactions.
- `SettingsForm` and its account/preferences/payment children provide existing native form, tab, sheet, popover, and confirmation-dialog patterns.

## Event and calendar UI

- `CreateEvent/EventForm/EventForm.tsx` is an in-progress React Hook Form/Zod event form.
- `CreateEvent/ImageSelection/*` provides the existing event-image picker, categories, search, upload, and dialog layout.
- `Calendars/CreateCalendar.tsx` is the only calendar-specific component and is not exposed by an implemented page route.
- The baseline has no event card, event feed, event detail, or rendered calendar/grid component. These absences are part of the snapshot and must not be misrepresented as regressions later.

## Primitive/component system

- Existing primitives live under `src/components/ui/` and follow shadcn's `new-york` conventions on Radix UI.
- Available patterns include alert dialogs, dialogs, dropdown menus, forms, inputs, OTP inputs, popovers, radio/select controls, scroll areas, sheets, tabs, textareas, toast/sonner, and tooltips.
- Icons come from Lucide React and React Icons.
- New campus UI must reuse these primitives and the existing component-specific Tailwind patterns.

