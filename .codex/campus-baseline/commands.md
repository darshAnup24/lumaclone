# Baseline commands and results

Captured on 2026-08-09 from the current working tree.

## Repository scripts

| Command | Purpose | Baseline result |
| --- | --- | --- |
| `npm run dev` | Next.js Turbopack development server | PASS: ready in about 1 second on `http://localhost:3000`. |
| `npm run build` | Production Next.js build | FAIL (pre-existing): compilation reaches route type validation, then rejects exported `DecryptToken` in `src/app/api/auth/generate-token/route.ts` because route files may export only supported fields. |
| `npm run start` | Serve a production build | Not run because the production build does not complete. |
| `npm run lint` | Configured lint script | FAIL (pre-existing): `next lint` opens Next.js's interactive first-time ESLint configuration prompt; no ESLint config exists, so it is not a usable non-interactive gate. |
| `npx tsc --noEmit` | Discovered standalone typecheck | FAIL (pre-existing): `src/components/ui/command.tsx` reports incompatible React types from the nested `cmdk` dependency and root React 19 type packages. |

No formatter, unit-test, integration-test, or end-to-end-test script exists in `package.json`; no automated tests were discovered.

## Development-server route smoke check

The following routes compiled and returned HTTP 200 from `next dev`: `/`, `/home`, `/signin`, `/finish-signup`, `/verifyAccount`, `/create`, and `/settings`.

The server logged no route compilation errors. It did log verbose i18next debug initialization, which is existing behavior.

## Screenshot commands

Headless Google Chrome captured:

- `screenshots/homepage-desktop.png` at 1440 x 1000.
- `screenshots/homepage-mobile.png` at 390 x 844.
- `screenshots/signin-desktop.png` at 1440 x 1000 with a 5-second virtual-time budget.
- `screenshots/repository-reference.png`, an exact copy of the pre-existing root `image.png` reference (4494 x 2526).

## Environment conventions

Only variable names were inspected; values were never printed or copied:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `UNSPLASH_ACCES_KEY` (existing spelling; the route currently reads `UNSPLASH_ACCESS_KEY`)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

There is no `.env.example` in the baseline.

