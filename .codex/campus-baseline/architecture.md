# Baseline architecture

Captured on 2026-08-09 from the current working tree.

## Application stack

- Framework: Next.js 15.1.7 App Router with React 18.
- Language: strict TypeScript/TSX, with `allowJs` enabled and `noEmit` typechecking.
- Package manager: npm (`package-lock.json`).
- Rendering: a mix of server route handlers and predominantly client page/components marked with `use client`.
- Styling: Tailwind CSS 3.4, CSS variables, dark-mode class switching, shadcn `new-york` conventions, and Radix UI primitives.
- Localization: `react-i18next` with English and Portuguese JSON resources.
- Forms: React Hook Form plus Zod.
- Animation/media: Motion package APIs, Next Video assets, and a landing-page WebM.

## Data and server layer

- Prisma 6 targets PostgreSQL through `DATABASE_URL` and `DIRECT_URL`.
- `src/lib/db.ts` exposes a singleton Prisma client.
- The current schema contains users, emails, preferences, calendars, subscriptions, cards, and OTP codes; it has no event table.
- App Router handlers under `src/app/api/` implement the current user, OTP/JWT authentication, Cloudinary upload, and Unsplash image flows.
- `src/lib/utils.ts` exports an Axios client and attaches the local-storage token in the browser.
- No Supabase SDK, Supabase migrations, Resend integration, global client state library, or automated test framework exists in the baseline.

## Authentication baseline

- Authentication is custom rather than Supabase: OTP emails are sent through Nodemailer, JWTs are handled with `jose`, and browser state is stored in local storage.
- Protected pages validate the token from client effects and redirect with `next/navigation`.
- Relevant existing environment-variable names are documented without values in `commands.md`; `.env` remains unmodified and untracked secrets are not copied into baseline artifacts.

## Build and configuration

- Next configuration only allows remote images from Unsplash and Cloudinary.
- TypeScript path alias `@/*` maps to `src/*`.
- Tailwind scans `src/pages`, `src/components`, and `src/app`.
- There is no root middleware, Pages Router, test directory, CI configuration, or deployment configuration in the baseline.

## Working-tree provenance

The snapshot intentionally represents the working tree at invocation time. Eleven pre-existing tracked files were already modified (40 insertions, 17 deletions), primarily page title localization and client-safety changes. The orchestrator did not edit or revert them. The supplied `campus-implementation-orchestrator/` package was also already untracked.

