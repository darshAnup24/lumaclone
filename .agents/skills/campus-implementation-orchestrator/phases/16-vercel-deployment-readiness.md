# Phase 16 — Vercel Deployment Readiness

## Objective
Prepare and verify production deployment without exposing secrets.

## Required
- framework-correct environment variables
- `.env.example`
- production build
- Vercel-compatible server/API/Edge functions
- Supabase migrations
- Resend configuration documentation
- README setup/deployment instructions
- no committed secrets

Likely variables include:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY

Use exact names required by the repository/framework.

## Acceptance criteria
- Production build succeeds.
- Deployment configuration is documented.
- Secrets are server-side only.
- README documents setup, migrations, Resend inbound/outbound setup, AI extraction, and Vercel deployment.
- Final E2E gates are green.
