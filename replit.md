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
- Optional env: `ADMIN_KEY` — Admin access key for the `/admin` dashboard (default: `aga-admin`)

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

- Public questionnaire POST endpoint (`/api/surveys`) requires no auth — anyone with the link can submit.
- Admin read endpoints (`GET /api/surveys`, `/api/surveys/stats`, `/api/surveys/:id`) require `x-admin-key` header or `?admin_key=` query param (default: `aga-admin`). Change via `ADMIN_KEY` env var before going to production.
- Multi-select fields (NCDs, barriers, telehealth uses) are stored as comma-separated strings.
- No user accounts — participants are anonymous; only demographic info is collected.
- Analysis not included in-app; all raw data accessible via the admin dashboard.

## Product

- **Patient-facing (`/`)**: 8-section multi-step questionnaire covering demographics, NCD status, follow-up behaviour, technology access, telehealth awareness, willingness/readiness, concerns, and open-ended feedback. Ends with a thank-you screen.
- **Admin dashboard (`/admin`)**: Stat cards (total submissions, NCD rate, avg willingness, telecare willingness), filterable table of all responses, full detail view per respondent.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any change to `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend or backend code.
- After any change to `lib/db/src/schema/`, run `pnpm run typecheck:libs` before building the API server.
- Admin endpoints return 401 if the wrong/missing `ADMIN_KEY` is used. Frontend passes it via headers in API client calls.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
