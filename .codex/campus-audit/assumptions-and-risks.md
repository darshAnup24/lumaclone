# Assumptions, risks, and required decisions

## Security findings

- Critical, repaired in Phase 1: the OTP route contained a hardcoded SMTP credential. It now uses existing server environment variables. The old credential must be revoked/rotated because repository history may still contain it.
- Critical: token generation trusts client-provided user ID/email and is not cryptographically tied to successful OTP verification.
- Critical: the user PATCH handler spreads arbitrary request fields into the user update (mass assignment).
- High: the OTP expiry comparison is reversed, so old codes may not expire as intended.
- High: custom JWTs live in local storage and route handlers often return HTTP 200 with an application-level `status`, complicating secure error handling.
- High: there is no RLS because the current application uses Prisma directly; campus data must not ship until Supabase policies are tested.
- Resolved in Phase 1: shared token helpers were moved out of the Next route file, restoring the production build.
- Medium: the `.env` variable uses `UNSPLASH_ACCES_KEY` while code expects `UNSPLASH_ACCESS_KEY`.
- Medium: image upload lacks explicit file type/size validation.

The Supabase Auth phase should replace, not preserve, the insecure custom auth mechanics while retaining their UI.

## Build/tooling risks

- Resolved in Phase 1: root React type packages now match the React 18 runtime and standalone typecheck passes.
- A non-interactive lint configuration now exists. No formatter script, tests, or CI exists yet.
- The production build passes; existing hook/image lint warnings remain non-blocking and must not be allowed to grow unnoticed.
- The existing README incorrectly claims Supabase is already used and contains an invalid Prisma command.

## Product/UI gaps

- `/home` is a placeholder; event cards/discovery do not exist.
- Header links advertise calendars/discover routes that are not implemented.
- Event detail and display calendar are absent.
- Event creation is unfinished and client-auth dependent.
- The 390px landing baseline has horizontal clipping; avoid worsening it and repair only in an authorized UI phase.

## Non-blocking assumptions for local implementation

- Campus timezone defaults to `Asia/Kolkata`, but stored timestamps use UTC with explicit timezone metadata.
- Email-extracted records always begin in `pending_review`; no automatic public publishing in MVP.
- Unknown categories/senders and ambiguous dates require admin review.
- Public users see only published events; authenticated users see their own drafts/requests as allowed by RLS.
- Capacity counts accepted participants; organizer membership does not consume capacity unless later specified.
- Inbound email bodies and metadata are retained; attachments go to a private bucket and are shown through authorized signed access.
- Transactional outbound email is sufficient for MVP; broad new-event broadcasts are prohibited.
- Interest/follow tables may be created for future architecture but recommendation delivery is out of MVP scope.

## External values required before live deployment

These do not block fixture-backed local phases but must be supplied for live integration/deployment:

- Supabase project URL, anon key, service-role key, and database migration access.
- Resend API key, verified sending domain/from address, inbound domain/address, and webhook signing secret.
- Approved organization sender addresses/domain patterns and initial admin user identity.
- AI provider key and selected structured-output-capable model.
- Public Vercel application URL and any cron secret/schedule.
- Data-retention/privacy policy for raw institutional email and attachments.

## Decisions deliberately deferred

- Exact campus/organization names and branding: seeds stay realistic but generic until supplied.
- AI provider/model: code should expose a narrow extraction interface and configurable model.
- Reminder scheduler runtime: Vercel cron is preferred but only added if Phase 9/10 requirements need it.
- Auto-publish threshold: disabled initially regardless of confidence, per specification.
