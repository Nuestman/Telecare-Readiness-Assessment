# AGA Health Foundation — Research Platform — System Documentation

**Version:** 1.0.0  
**Last updated:** 2026-07-03

## 1. Overview

Full-stack web application for the **AGA Health Foundation** (Obuasi Mine, Ghana) research team. It supports:

- **Multiple studies** under one platform (hub + per-study artifacts)
- **Anonymous survey collection** from participants via direct study URLs
- **Study-team admin** dashboards with role-based access per study
- **System administration** for study registry, collection windows, and access grants

Study #1 (`telehealth-readiness`) assesses community telehealth readiness. Study #2 (`clinician-telehealth-readiness`) is implemented but registered as `draft` until activated.

## 2. Project structure

```
workspace/
├── artifacts/
│   ├── api-server/              # Express API server
│   ├── telehealth-survey/       # React app: hub shell + all study UIs
│   └── research-hub/            # Stub README — hub code in telehealth-survey/src/platform/
├── lib/
│   ├── api-spec/                # OpenAPI spec + Orval codegen
│   ├── api-client-react/        # Generated TanStack Query hooks
│   ├── api-zod/                 # Generated Zod schemas
│   └── db/                      # Drizzle ORM + PostgreSQL schema
├── docs/                        # Architecture and platform design
└── scripts/                     # dev-local.ps1, smoke-api.ps1, restart-api.ps1
```

Hub code path: `artifacts/telehealth-survey/src/platform/`  
Study bundles: `artifacts/telehealth-survey/src/studies/{slug}/`

## 3. Technology stack

- **Monorepo:** pnpm workspaces
- **Runtime:** Node.js 24
- **Language:** TypeScript 5.9
- **Frontend:** React 19, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter
- **Backend:** Express 5, Zod validation
- **Database:** PostgreSQL + Drizzle ORM
- **API contract:** OpenAPI 3.1 + Orval codegen
- **Auth:** `express-session` + PostgreSQL store; study and system session kinds

## 4. Artifacts & workflows

| Artifact | Purpose | Dev command |
|----------|---------|-------------|
| `artifacts/telehealth-survey` | Hub + all study UIs | `pnpm run dev` (via root script) |
| `artifacts/api-server` | REST API + DB access | Started by `scripts/dev-local.ps1` |
| `artifacts/mockup-sandbox` | Component preview (optional) | `pnpm --filter @workspace/mockup-sandbox run dev` |

Root `pnpm run dev` loads `.env`, builds the API, starts it on `PORT` (default 8080), then starts Vite on `TELEHEALTH_PORT` (default 21409).

## 5. Database schema

### Platform tables

| Table | Purpose |
|-------|---------|
| `studies` | Study registry (slug, status, collection window, metadata) |
| `system_admins` | Platform operators |
| `admin_users` | Study-team accounts |
| `admin_user_study_access` | Per-study role grants (`viewer`, `analyst`, `admin`) |
| `session` | Express session store |

### Per-study response tables

| Table | Study slug |
|-------|------------|
| `telehealth_readiness_surveys` | `telehealth-readiness` |
| `clinician_telehealth_readiness_surveys` | `clinician-telehealth-readiness` |

Apply platform migration:

```bash
pnpm db:migrate:platform
```

Migration also runs on API startup via `ensure-platform-schema.ts`.

## 6. API overview

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/studies` | Public study directory (active/paused only) |
| `POST` | `/api/studies/{slug}/surveys` | Submit survey (per study) |
| `GET` | `/api/studies/{slug}/status` | Collection open/closed |

### Study team (`sessionKind: "study"`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Study-team login |
| `GET` | `/api/auth/me` | Current user + `studyAccess[]` |
| `GET` | `/api/studies/{slug}/surveys` | List responses (viewer+) |
| `GET` | `/api/studies/{slug}/surveys/stats` | Aggregate stats (viewer+) |
| `GET` | `/api/studies/{slug}/surveys/export` | CSV export (analyst+) |
| `GET/POST/PATCH/DELETE` | `/api/auth/admin/users` | User management (admin) |

### System admin (`sessionKind: "system"`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/system/auth/login` | System admin login |
| `GET` | `/api/system/dashboard` | Platform metrics |
| `GET/POST/PATCH/DELETE` | `/api/system/studies` | Study registry CRUD |
| `GET/POST/PATCH/DELETE` | `/api/system/studies/{slug}/access` | Study access grants |
| `GET` | `/api/system/users` | All study-team users + access |
| `GET` | `/api/system/health` | System health snapshot |
| `POST` | `/api/system/health/run-tests` | Run built-in smoke tests |

Legacy paths (`/api/surveys`, etc.) remain as aliases for `telehealth-readiness`.

Full API design: [platform/system-admin.md](./platform/system-admin.md)

## 7. Authentication & authorization

### Session kinds

- **Study session** — study-team login; `sessionKind: "study"`
- **System session** — platform admin login; `sessionKind: "system"`
- Legacy sessions (pre-platform) without `sessionKind` are treated as study sessions when `userId` + `role` are present.

### Study roles (per study via `admin_user_study_access`)

| Role | Permissions |
|------|-------------|
| `viewer` | Read stats, list, detail |
| `analyst` | viewer + CSV export |
| `admin` | analyst + user management for that study |

Insufficient role returns a descriptive 403 (required role vs current role).

### Bootstrap

- **First study admin:** register at `/studies/telehealth-readiness/admin/register` when no approved users exist
- **System admin:** `SYSTEM_ADMIN_EMAIL` / `SYSTEM_ADMIN_PASSWORD` (or `INITIAL_ADMIN_*` fallback) on first API start when `system_admins` is empty

## 8. Frontend routing

| Path | Purpose | Auth |
|------|---------|------|
| `/` | Platform landing (study directory) | No |
| `/studies/telehealth-readiness/*` | Study #1 | Varies |
| `/studies/clinician-telehealth-readiness/*` | Study #2 (draft) | Varies |
| `/system/admin/login` | System admin login | No |
| `/system/admin` | System dashboard | System |
| `/system/admin/health` | Health + smoke tests | System |
| `/system/admin/studies` | Study registry | System |
| `/system/admin/studies/{slug}/access` | Access grants | System |
| `/system/admin/users` | User overview | System |

Legacy paths (`/survey`, `/admin`, …) redirect to telehealth study routes.

Route guards: `ProtectedStudyAdminRoute` enforces study membership and minimum role before rendering admin pages.

## 9. Deployment & environment

| Variable | Used by | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `lib/db` | PostgreSQL connection string |
| `SESSION_SECRET` | `api-server` | Session cookie signing |
| `PORT` | `api-server` | API port (default 8080) |
| `TELEHEALTH_PORT` | Vite dev | Frontend port (default 21409) |
| `SYSTEM_ADMIN_EMAIL` / `SYSTEM_ADMIN_PASSWORD` | `api-server` | Bootstrap system admin |
| `INITIAL_ADMIN_*` | `api-server` | Fallback for system admin bootstrap |
| `SYSTEM_ADMIN_BOOTSTRAP_ENABLED` | `api-server` | Set `false` after bootstrap |
| `SURVEY_OPENS_AT` / `SURVEY_CLOSES_AT` | `api-server` | Env fallback for collection window |
| `CORS_ORIGINS` | `api-server` | Production CORS allowlist |

### Schema changes

Use the platform migration for production:

```bash
pnpm db:migrate:platform
```

For local schema iteration only: `pnpm --filter @workspace/db run push`

## 10. Development commands

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm db:migrate:platform
pnpm run dev                    # Windows: API + frontend
pnpm --filter @workspace/api-spec run codegen
```

Windows helpers: `scripts/restart-api.ps1`, `scripts/smoke-api.ps1`

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| API exit on `pnpm run dev` | Port 8080 in use | `scripts/restart-api.ps1` or kill existing process |
| `DATABASE_URL must be set` | `.env` not loaded | Run via `pnpm run dev`; check `.env` exists |
| Admin 401 on surveys | Legacy session or wrong session kind | Log out and log in again |
| Admin 403 on dashboard | No `admin_user_study_access` row | Grant access via `/system/admin` |
| Users page "Insufficient access" | Role below `admin` | Expected — contact study admin |
| Study #2 not on hub | Registry status `draft` | Activate via system admin |

## 12. Related documentation

- [platform/README.md](./platform/README.md) — platform design index
- [hub-roadmap.md](./hub-roadmap.md) — roadmap and phase status
- [CHANGELOG.md](../CHANGELOG.md) — release history
