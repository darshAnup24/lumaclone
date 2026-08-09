# Campus LeviClub

Campus LeviClub preserves the existing LeviClub clone interface and adds one campus activity system for official events extracted from institutional email and student-created activities.

<div style="border:2px solid #e11d48;border-radius:12px;padding:14px 18px;margin:18px 0 22px;background:#fff1f2;color:#881337;">

**<span style="color:#e11d48;font-size:1.05em;">NEW FEATURE — Events created automatically from email</span>**

Campus LeviClub now turns ordinary club emails into published events. A club (or a judge testing the platform) sends one email to the platform inbox and the event appears on the events page — no manual entry.

**Why this stands out:**

- **Zero manual entry** — clubs keep sending normal emails; there is nothing to fill in.
- **LLM-classified** — title, dates, category, venue, and confidence are extracted automatically by the AI model.
- **Instant publish** — high-confidence events go live immediately, with no sender restriction.
- **Fits the existing Luma UI** — the event shows up on Home, Discover, Calendars, and the event detail page with its category cover image.

</div>

## Demo for judges: email an event, watch it publish

1. **Sign in** to the deployed platform (Google or email magic link).
2. **Send an event email** to the platform inbox at `events@moreusul.resend.app`.

**The pipeline in brief:**

```text
Your email → Resend webhook (email.received)
  → raw email stored in Supabase
  → Groq LLM extracts a structured event (title, dates, category, venue, confidence)
  → confidence >= 0.75 → auto-published
  → event appears in Home / Discover / Calendars
```

3. Use the button below to open a new email to `events@moreusul.resend.app`:

<div align="left">
<a href="mailto:events@moreusul.resend.app?subject=Tech%20Club%20Workshop&amp;body=Tech%20Club%20Workshop%0A%0AWe%20are%20organizing%20a%20workshop%20on%20Web%20Development.%0A%0ADate%3A%20August%2015%2C%202026%0ATime%3A%2010%3A00%20AM%20to%201%3A00%20PM%0AVenue%3A%20RVCE%20campus%2C%20Block%20B">
<button type="button" style="background:#111827;color:#ffffff;border:none;border-radius:8px;padding:12px 18px;font-size:16px;font-weight:600;cursor:pointer;">Compose test event email → events@moreusul.resend.app</button>
</a>
</div>

4. **Type your own event details** in the email body — a clear title, date and time, venue, and a short description (the prefilled example is a safe starting point).
5. **Send it.** Within seconds the webhook fires and the LLM classifies your email.
6. **Open the Events page** on the platform and see your event updated automatically. Low-confidence or unclear-date emails go to the admin review queue instead of publishing.


## Architecture

```text
Institutional email
  → Resend receiving domain
  → signed /api/webhooks/resend webhook
  → raw inbound email in Supabase
  → Groq structured event extraction
  → duplicate/update detection
  → automatic publication or admin review
  → unified Supabase events table
  → existing LeviClub event and calendar UI
```

Automatic publication follows the configured policy: a relevant email is published when confidence is absent or meets `AI_AUTO_PUBLISH_THRESHOLD` and the date is unambiguous. Ambiguous-date, low-confidence, and likely-update records stay in `/admin/review`. Unsupported AI category labels normalize to `other`; legacy `unknown` records must be categorized by an admin before publication.

## Student events

```text
Student
  → creates a solo activity
  → another student requests to join
  → organizer accepts or rejects
  → in-app notification + Resend email
```

The application uses Next.js App Router, Supabase Auth/Postgres/RLS, Resend, and a Groq OpenAI-compatible model. It does not require Docker, a local Supabase stack, downloaded event images, or a CI/CD workflow.

## Local setup

Requirements: Node.js 20+, npm, a cloud Supabase project, a Resend account/domain, and a Groq API key.

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. Validate a change with:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Do not commit `.env`; it is ignored. `.env.example` intentionally contains names only.

## Environment variables

Required for the campus application:

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Cloud Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | Supabase publishable/anon key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Inbound processing and trusted service work |
| `RESEND_API_KEY` | Server only | Fetch received email and send transactional email |
| `RESEND_FROM_EMAIL` | Server only | Verified sender, for example `Campus <events@your-domain>` |
| `RESEND_WEBHOOK_SECRET` | Server only | Signing secret for the receiving webhook |
| `AI_PROVIDER` | Server only | Use `groq` for the configured integration |
| `GROQ_API_KEY` | Server only | Groq API key |
| `GROQ_MODEL` | Server only | Tested with `openai/gpt-oss-120b` |
| `AI_AUTO_PUBLISH_THRESHOLD` | Server only | Confidence threshold, normally `0.75` |

`OPENAI_API_KEY` and `AI_MODEL` are optional alternatives when `AI_PROVIDER=openai`. `CLOUDINARY_*` and `UNSPLASH_ACCESS_KEY` are optional legacy LeviClub image integrations; event covers remain cloud URLs and are not downloaded into the repository.

Never prefix the service-role, Resend, Groq, OpenAI, or Cloudinary secret with `NEXT_PUBLIC_`.

## Supabase

This project uses the cloud project directly; Docker and `supabase start` are not needed.

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Five ordered migrations create the unified data model, Row Level Security policies, request/notification functions, outbound logs, and duplicate/update history. `supabase/seed.sql` is idempotent and optional; it adds sample official organizations/events with remote cover URLs only.

Supabase Authentication configuration:

1. Set the production Site URL to the deployed origin.
2. Add `https://YOUR_DOMAIN/auth/confirm` and `https://YOUR_DOMAIN/auth/callback` to allowed redirect URLs. For local development, also add the same paths under `http://localhost:3000`.
3. In **Authentication → Email Templates → Magic Link**, keep a clickable magic-link template using `{{ .ConfirmationURL }}`. Do not replace it with a six-digit `{{ .Token }}` OTP template.
4. In **Authentication → Providers → Google**, enable Google and add the OAuth client ID and secret from Google Cloud. In the Google OAuth client, use Supabase's callback URL `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` as an authorized redirect URI.
5. Create/sign in the first admin, then set the role in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin@college.edu';
```

Admin status is read from `profiles.role` on the server and enforced again by database RLS/functions; there is no client-side admin flag.

## Resend inbound and outbound

1. Add and verify the sending/receiving domain in Resend.
2. Add every DNS record Resend supplies, including the receiving MX record.
3. Set `RESEND_FROM_EMAIL` to an address on the verified sending domain.
4. Create a webhook for the `email.received` event at:

   `https://YOUR_DOMAIN/api/webhooks/resend`

5. Copy its signing secret into `RESEND_WEBHOOK_SECRET` and the API key into `RESEND_API_KEY`.
6. Add exact approved sender addresses to `organizations.email_patterns` in Supabase. Matching senders get their events linked to the organization; publication itself is confidence-based, so unknown senders still publish when the extraction is confident.

The webhook verifies the timestamped HMAC signature before fetching content, preserves raw text/HTML and attachment metadata, and is idempotent on Resend message ID. Attachment metadata is stored in Supabase; no image attachment is downloaded into this repository.

## AI extraction and review

The default provider is Groq:

```dotenv
AI_PROVIDER=groq
GROQ_MODEL=openai/gpt-oss-120b
AI_AUTO_PUBLISH_THRESHOLD=0.75
```

The server requests strict structured JSON and validates it with Zod before writing an event. Dates use the email receipt time as context and default campus timezone `Asia/Kolkata`. The admin page at `/admin/review` can edit extraction fields, publish/reject uncertain records, and resolve likely updates with Apply Update, Create New, or Reject. Applying an update preserves the existing event ID and records old/new snapshots.

Optional live checks (they create uniquely tagged cloud rows and clean them up):

```bash
LIVE_AI_VALIDATION=1 node --env-file=.env node_modules/vitest/vitest.mjs run tests/ai/groq-live.test.ts
LIVE_SUPABASE_VALIDATION=1 node --env-file=.env node_modules/vitest/vitest.mjs run tests/security/cloud-rls-live.test.ts
LIVE_E2E_VALIDATION=1 node --env-file=.env node_modules/vitest/vitest.mjs run tests/e2e/inbound-calendar-live.test.ts
```

## Vercel deployment

No custom runtime or `vercel.json` is required. Next.js App Router pages and route handlers deploy as Vercel Functions; the inbound route sets a 60-second maximum for its network/database/AI work.

1. Import the repository in the Vercel dashboard.
2. Keep the framework preset as Next.js and the build command as `npm run build`.
3. Add every required environment variable above to Production. Add them to Preview only if previews should call the same external services.
4. Treat `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, and `GROQ_API_KEY` as sensitive server secrets.
5. Deploy, then update the Supabase Site URL/redirect allow-list and Resend webhook URL to the final domain.
6. Trigger a signed test email, confirm its inbound row/event, and check `/home`, `/discover`, `/calendars`, and `/admin/review` with the appropriate accounts.

Environment-variable changes apply only to new Vercel deployments, so redeploy after adding or rotating a key. This repository intentionally includes no CI/CD workflow.

## Security notes

- Public event reads are limited to `published`; owners/admins receive only their allowed additional rows.
- Student ownership and request identity are derived from the authenticated session, never request JSON.
- Email event publication, organization verification, and update resolution require the database admin role.
- Webhook, service-role, email, and AI credentials are imported only by server modules/routes.
- Rotate any credential that has previously been pasted into a tracked file or shared conversation.
