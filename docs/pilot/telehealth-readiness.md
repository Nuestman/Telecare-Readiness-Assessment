# Telehealth Readiness Pilot — Operations Guide

Study slug: `telehealth-readiness`

## Public URLs

| Page | Canonical path |
|------|------------------|
| Landing | `/studies/telehealth-readiness` |
| Survey | `/studies/telehealth-readiness/survey` |

Legacy paths (`/`, `/survey`) redirect to the canonical routes.

## Admin URLs

| Page | Path |
|------|------|
| Login | `/studies/telehealth-readiness/admin/login` |
| Dashboard | `/studies/telehealth-readiness/admin` |
| Pilot report | `/studies/telehealth-readiness/admin/report` |
| Response detail | `/studies/telehealth-readiness/admin/responses/:id` |

## Environment variables

See [`.env.example`](../../.env.example). Required for production:

- `DATABASE_URL`
- `SESSION_SECRET`
- `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` (first deploy only)

Optional:

- `SURVEY_OPENS_AT` / `SURVEY_CLOSES_AT` — collection window
- `CORS_ORIGINS` — production frontend origins (comma-separated)

## Roles

| Role | Access |
|------|--------|
| `viewer` | Read dashboard, stats, responses |
| `analyst` | viewer + CSV export |
| `admin` | analyst + user management (future) |

## Local development

```powershell
pnpm install
pnpm run dev
```

Log in at `/studies/telehealth-readiness/admin/login` with credentials from `.env`.

## Database migrations

After schema changes:

```bash
pnpm --filter @workspace/db run push
```

## API

Canonical base: `/api/studies/telehealth-readiness/`

Legacy `/api/surveys` routes remain as aliases during the pilot.
