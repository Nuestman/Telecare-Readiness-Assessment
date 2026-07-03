# AGA Health Foundation — Research Platform

**Version:** 1.0.0  
**Organization:** AGA Health Foundation (Obuasi Mine, Ghana)

Multi-study research platform for hospital-facing surveys, study-team admin dashboards, and platform-level system administration.

## Quick start (local, Windows)

```powershell
# 1. Copy env template and set DATABASE_URL + SESSION_SECRET
copy .env.example .env

# 2. Install dependencies
pnpm install

# 3. Apply platform database migration
pnpm db:migrate:platform

# 4. Start API + frontend
pnpm run dev
```

- **Hub landing:** http://localhost:21409/
- **Study #1 (telehealth):** http://localhost:21409/studies/telehealth-readiness
- **System admin:** http://localhost:21409/system/admin/login
- **API:** http://localhost:8080/api/healthz

Use a Neon **public** `DATABASE_URL` for local development (Replit `helium` hostnames only work inside Replit).

## Repository structure

```
workspace/
├── artifacts/
│   ├── api-server/           # Express API (sessions, studies, system admin)
│   ├── telehealth-survey/    # React app: hub shell + study UIs
│   └── research-hub/         # Stub — hub code lives in telehealth-survey/src/platform/
├── lib/
│   ├── db/                   # Drizzle schema + platform migration
│   ├── api-spec/             # OpenAPI + Orval codegen
│   ├── api-client-react/     # TanStack Query hooks
│   └── api-zod/              # Zod validation schemas
├── docs/                     # Architecture, platform design, study docs
└── scripts/                  # dev-local.ps1, smoke-api.ps1, restart-api.ps1
```

## Studies

| Slug | Status | Routes |
|------|--------|--------|
| `telehealth-readiness` | Active | `/studies/telehealth-readiness/*` |
| `clinician-telehealth-readiness` | Draft (registry) | `/studies/clinician-telehealth-readiness/*` |

Participants use **direct study URLs**. The hub `/` is for staff discovery and platform administration.

## Authentication

| Role | Login | Scope |
|------|-------|-------|
| **Participant** | None | Public survey submission |
| **Study team** | `/studies/{slug}/admin/login` | Per-study viewer / analyst / admin |
| **System admin** | `/system/admin/login` | Cross-study registry and access control |

Bootstrap the first system admin with `SYSTEM_ADMIN_EMAIL` / `SYSTEM_ADMIN_PASSWORD` (or `INITIAL_ADMIN_*` fallback) when `system_admins` is empty.

## Common commands

```bash
pnpm run typecheck              # Typecheck all packages
pnpm run build                  # Build all artifacts
pnpm db:migrate:platform        # Apply platform schema migration
pnpm --filter @workspace/api-spec run codegen   # Regenerate API clients
```

### Windows helpers

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/restart-api.ps1   # Rebuild + restart API only
powershell -ExecutionPolicy Bypass -File ./scripts/smoke-api.ps1     # CLI smoke tests
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/system-architecture.md](docs/system-architecture.md) | Technical reference |
| [docs/platform/README.md](docs/platform/README.md) | Platform design index |
| [docs/hub-roadmap.md](docs/hub-roadmap.md) | Hub vision and phase status |
| [CHANGELOG.md](CHANGELOG.md) | Release history |

## Environment variables

See [.env.example](.env.example). Required: `DATABASE_URL`, `SESSION_SECRET`. System admin bootstrap: `SYSTEM_ADMIN_*` or `INITIAL_ADMIN_*`.

## License

MIT
