# AGA Health Foundation — Telehealth Readiness Survey

A research web app for AGA Obuasi mine employees and contractors to assess their readiness to use telehealth/telecare services. The hospital is AGA Health Foundation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/telehealth-survey run dev` — run the survey frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session cookie signing secret
- First deploy: visit `/studies/telehealth-readiness/admin/register` once to create the first admin (route closes automatically)
- Optional env: `SURVEY_OPENS_AT`, `SURVEY_CLOSES_AT` — collection window
- Optional env: `CORS_ORIGINS` — comma-separated allowed origins in production

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (`lib/db/src/schema/surveys.ts`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + TanStack Query

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/surveys.ts` — Survey table schema
- `artifacts/api-server/src/routes/surveys.ts` — Survey API routes
- `artifacts/telehealth-survey/src/` — Frontend (questionnaire + admin dashboard)

## Architecture decisions

- Public questionnaire POST endpoint requires no auth — anyone with the link can submit (when collection is open).
- Admin endpoints require session authentication (`POST /api/auth/login`). Roles: `viewer`, `analyst`, `admin`.
- Canonical study routes: `/studies/telehealth-readiness/...` (legacy `/`, `/survey`, `/admin` redirect).
- Multi-select fields (NCDs, barriers, telehealth uses) are stored as comma-separated strings.
- No user accounts — participants are anonymous; only demographic info is collected.
- Analysis not included in-app; all raw data accessible via the admin dashboard.

## Product

- **Patient-facing (`/`)**: 8-section multi-step questionnaire covering demographics, NCD status, follow-up behaviour, technology access, telehealth awareness, willingness/readiness, concerns, and open-ended feedback. Ends with a thank-you screen.
- **Admin dashboard (`/studies/telehealth-readiness/admin`)**: Stat cards, filterable charts, paginated table, CSV export, QR share link, printable pilot report.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any change to `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend or backend code.
- After any change to `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push` against **each** database you use (local `.env` and Replit production secrets). Replit/Neon “development” and “production” branches are separate databases.
- Admin endpoints return 401 without a valid session. Log in at `/studies/telehealth-readiness/admin/login`. If no admin exists yet, use `/studies/telehealth-readiness/admin/register` once.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
