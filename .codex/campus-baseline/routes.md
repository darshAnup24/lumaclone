# Baseline routes

Captured on 2026-08-09 from the current working tree.

## Implemented pages

| Route | File | Baseline behavior |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Public Luma landing page with header, animated phone/event media, create-event CTA, and footer. |
| `/home` | `src/app/home/page.tsx` | Authenticated header shell and a placeholder `Home` heading; no event discovery feed is implemented. |
| `/signin` | `src/app/signin/page.tsx` | Existing email/phone sign-in card using the custom OTP flow. |
| `/finish-signup` | `src/app/finish-signup/page.tsx` | Username completion form followed by the existing welcome state. |
| `/verifyAccount` | `src/app/verifyAccount/page.tsx` | OTP verification form followed by the existing welcome state. |
| `/create` | `src/app/create/page.tsx` | Client-token-protected event creation screen with image selection and an in-progress event form. |
| `/settings` | `src/app/settings/page.tsx` | Existing account, preferences, and payment settings tabs. |

All seven page routes returned HTTP 200 from `next dev` during the baseline run. Client-side redirects and authentication behavior are not represented by the raw HTTP status.

## Implemented API routes

- `/api/auth/send-otp`
- `/api/auth/verify-otp`
- `/api/auth/generate-token`
- `/api/auth/validate-token`
- `/api/user`
- `/api/user/upload-image`
- `/api/images/random-event`

## Advertised but not implemented page routes

The existing header, footer, and settings UI link to routes that have no App Router page yet, including `/calendars`, `/discover`, `/explore`, `/create-calendar`, `/releases`, `/pricing`, `/help`, `/terms`, `/privacy`, and `/security`. There is no event-detail route in the baseline.

