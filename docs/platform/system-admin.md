# Platform — System Admin APIs & UI

**Status:** Implemented (v1.1.0)  
**Last updated:** 2026-07-05  
**Last updated:** 2026-07-03

---

## 1. Role definition

**System administrators** operate the research platform. They:

- Create and configure studies in the registry
- Set per-study collection windows (`opens_at` / `closes_at`)
- Change study visibility (`draft` → `active` → `closed`)
- Grant or revoke **study-team** access (`admin_users` ↔ studies)
- View platform-wide summary (study count, total responses — not cross-study analytics)

They do **not** replace study-team workflows:

- Response review, CSV export, and pilot reports remain at `/studies/{slug}/admin`
- Study-team user role changes (`viewer` / `analyst` / `admin`) within a study remain at `/studies/{slug}/admin/users` for users who have study `admin` role

---

## 2. Environment variables

Add to `.env` (and Replit / Render / Railway secrets):

| Variable | Required | Purpose |
|----------|----------|---------|
| `SYSTEM_ADMIN_EMAIL` | Yes (first deploy) | Bootstrap system admin email if `system_admins` table is empty |
| `SYSTEM_ADMIN_PASSWORD` | Yes (first deploy) | Bootstrap password (min 12 chars); **change after first login** |
| `SYSTEM_ADMIN_BOOTSTRAP_ENABLED` | No | Default `true`. When `false`, skip env bootstrap |
| `INITIAL_ADMIN_EMAIL` | Fallback | Used when `SYSTEM_ADMIN_EMAIL` unset |
| `INITIAL_ADMIN_PASSWORD` | Fallback | Used when `SYSTEM_ADMIN_PASSWORD` unset |
| `SYSTEM_ADMIN_SESSION_MAX_AGE_MS` | No | Override session TTL for system logins (default: same as study sessions — 7 days) |

### Existing variables (unchanged)

| Variable | Notes |
|----------|-------|
| `SESSION_SECRET` | Signs both study and system sessions |
| `DATABASE_URL` | PostgreSQL |
| `SURVEY_OPENS_AT` / `SURVEY_CLOSES_AT` | Deprecated for telehealth after DB migration; kept as fallback |

### Example `.env` block

```env
# System admin bootstrap (first deploy only — disable after account exists)
SYSTEM_ADMIN_EMAIL=platform-admin@agahealthfoundation.org
SYSTEM_ADMIN_PASSWORD=change-me-use-a-password-manager
SYSTEM_ADMIN_BOOTSTRAP_ENABLED=true
```

### Bootstrap behaviour (API startup)

1. If `SYSTEM_ADMIN_BOOTSTRAP_ENABLED` is not `false` and `system_admins` has zero rows:
   - Require `SYSTEM_ADMIN_EMAIL` and `SYSTEM_ADMIN_PASSWORD` (fail fast in production if missing)
   - Insert one row with bcrypt-hashed password
   - Log: `System admin bootstrapped for {email}` (never log password)
2. If rows exist, env bootstrap is skipped (even if vars are set)
3. Set `SYSTEM_ADMIN_BOOTSTRAP_ENABLED=false` in production after first successful login

**No API key header for v1** — session-only, matching study-team auth. A `SYSTEM_ADMIN_API_KEY` may be added later for automation/scripts.

---

## 3. API routes

Base path: `/api/system`. All routes except login return JSON errors `{ "error": "..." }`.

### 3.1 Authentication

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `POST` | `/api/system/auth/login` | Public | `{ email, password }` | `{ user: SystemAdminPublic }` + session cookie |
| `POST` | `/api/system/auth/logout` | System | — | `{ ok: true }` |
| `GET` | `/api/system/auth/me` | System | — | `{ user: SystemAdminPublic }` or `401` |

```ts
type SystemAdminPublic = {
  id: number;
  email: string;
  name: string;
  createdAt: string; // ISO
};
```

### 3.2 Public study directory (hub landing)

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/api/studies` | Public | `{ studies: PublicStudyCard[] }` |

`active` and `paused` studies only. `draft` / `closed` / `archived` excluded. `paused` includes `status: "paused"` for badge rendering.

```ts
type PublicStudyCard = {
  slug: string;
  shortTitle: string;
  fullTitle: string;
  status: "active" | "paused";
  estimatedMinutes: string | null;
  collectionOpen: boolean;
  organization: string;
};
```

### 3.3 Study registry (system admin)

**Creating a new study row** registers metadata only. A new study still requires IT to add an artifact, responses table, and API handlers ([decisions.md](./decisions.md) O1).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/system/studies` | System | List all studies (including draft/archived) |
| `POST` | `/api/system/studies` | System | Create study |
| `GET` | `/api/system/studies/:slug` | System | Full study record |
| `PATCH` | `/api/system/studies/:slug` | System | Update metadata, status, windows |
| `DELETE` | `/api/system/studies/:slug` | System | Soft-delete → `archived` (never hard-delete if responses exist) |

**Create body:**

```json
{
  "slug": "telehealth-readiness",
  "shortTitle": "Telehealth Readiness Survey",
  "fullTitle": "Assessment of Telehealth Readiness Among AGA Obuasi Mine Employees and Contractors",
  "organization": "AGA Health Foundation",
  "location": "Obuasi Mine, Ghana",
  "principalInvestigator": "Dr. Example",
  "ethicsReference": "IRB-2026-001",
  "contactEmail": "research@agahealthfoundation.org",
  "contactPhone": "+233 ...",
  "estimatedMinutes": "5–8",
  "status": "draft",
  "opensAt": null,
  "closesAt": null
}
```

**Slug rules:** `^[a-z0-9]+(-[a-z0-9]+)*$`, max 64 chars, unique.

### 3.4 Study access management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/system/studies/:slug/access` | System | List study-team members for this study |
| `POST` | `/api/system/studies/:slug/access` | System | Grant access |
| `PATCH` | `/api/system/studies/:slug/access/:userId` | System | Change role on study |
| `DELETE` | `/api/system/studies/:slug/access/:userId` | System | Revoke access |

**Grant body:**

```json
{
  "adminUserId": 42,
  "role": "analyst"
}
```

Or invite by email (creates pending user if not exists — v1.1):

```json
{
  "email": "analyst@example.com",
  "name": "Jane Analyst",
  "role": "viewer"
}
```

**Roles on a study:** same enum as today — `viewer` | `analyst` | `admin`.

### 3.5 Study-team overview (read-only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/system/users` | System | Paginated list of `admin_users` with their study memberships |
| `GET` | `/api/system/users/:id` | System | One user + all study access rows |

### 3.6 Platform summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/system/dashboard` | System | `{ studyCount, activeStudies, totalResponses, responsesByStudy: [{ slug, count }] }` |

---

## 4. Middleware

| Middleware | File (planned) | Checks |
|------------|----------------|--------|
| `requireSystemAuth` | `middleware/system-auth.ts` | `req.session.sessionKind === "system"` |
| `requireStudyAuth` | `middleware/auth.ts` (extend) | `sessionKind === "study"` + approved |
| `requireStudyAccess(slug)` | `middleware/study-access.ts` | Membership row for `slug` (system admins bypass on system routes only, not study routes) |
| `resolveStudyFromParams` | `middleware/study.ts` | Validates slug exists in registry |

### Study API changes

Existing routes under `/api/studies/telehealth-readiness/*` become parameterized:

```
/api/studies/:studySlug/surveys
/api/studies/:studySlug/status
```

Each admin handler chain: `requireStudyAuth` → `requireStudyAccess(studySlug)` → `requireRole(...)`.

---

## 5. OpenAPI

Add tags and paths to `lib/api-spec/openapi.yaml`:

- `SystemAuth`
- `SystemStudies`
- `SystemStudyAccess`
- `PublicStudies`

Run `pnpm --filter @workspace/api-spec run codegen` after implementation.

---

## 6. UI screens

Base path: `/system/admin`. Layout: `SystemAdminLayout` — sidebar, AGA branding, logout.

### 6.1 Login — `/system/admin/login`

- Email + password form
- Link: "Research team login" → `/` (platform landing; user picks study)
- No self-registration
- On success → `/system/admin`

### 6.2 Dashboard — `/system/admin`

- Cards: active studies, total responses, studies in draft
- Table: studies with status, response count, collection window, quick links
  - **Edit** → study edit
  - **Access** → study access
  - **Open study admin** → `/studies/{slug}/admin` (opens in new tab; requires separate study login unless we add impersonation — **not in v1**)

### 6.3 Studies list — `/system/admin/studies`

- Filter by status
- **Add study** button → create form (slug, titles, PI, ethics, status)
- Warning if slug has no frontend module in codebase (static list in dev doc only for v1)

### 6.4 Study edit — `/system/admin/studies/:slug`

Sections:

1. **Metadata** — titles, organization, contacts, ethics
2. **Status** — dropdown: draft / active / paused / closed / archived
3. **Collection window** — datetime pickers for opens/closes; "always open" toggle
4. **Danger zone** — archive study (confirm dialog)

### 6.5 Study access — `/system/admin/studies/:slug/access`

- Table: name, email, study role, granted date
- **Grant access** — select existing user (search) or email invite
- **Change role** / **Revoke** per row

### 6.6 Users — `/system/admin/users`

- Read-only directory of all study-team accounts
- Click through to see study memberships (edit via study access pages)

---

## 7. Frontend paths helper (planned)

```ts
// artifacts/research-hub/src/paths.ts

export const platformPaths = {
  landing: "/",
  studies: "/studies", // redirect to landing
} as const;

export const systemAdminPaths = {
  login: "/system/admin/login",
  dashboard: "/system/admin",
  health: "/system/admin/health",
  studies: "/system/admin/studies",
  studyEdit: (slug: string) => `/system/admin/studies/${slug}`,
  studyAccess: (slug: string) => `/system/admin/studies/${slug}/access`,
  users: "/system/admin/users",
} as const;
```

---

## 8. Study-team login & registration (updated)

### Login

1. User opens `/studies/telehealth-readiness/admin/login`
2. `POST /api/auth/login` — sets `sessionKind: "study"`
3. `GET /api/auth/me` includes `studyAccess[]`
4. Frontend checks membership for current study slug
5. No access → "Contact your platform administrator or study lead"

### Registration — study-scoped invite (approved)

Study `admin` invites colleagues via **`/studies/{slug}/registration`**:

1. `POST /api/auth/register` body includes `studySlug: "telehealth-readiness"` (required when registering from study path)
2. New user created with `status: pending` (or approved if study admin approves in same flow — TBD in implementation)
3. On approval, **auto-grant** `admin_user_study_access` for that `studySlug` only — not other studies
4. Study `admin` cannot grant access to studies they do not administer

System admin can still grant any study via `/system/admin/studies/:slug/access`.

### First-user bootstrap (telehealth)

If zero approved users exist globally, first registrant becomes `admin` and receives `telehealth-readiness` access (existing behaviour + migration seed).

---

## 9. Error codes

| HTTP | When |
|------|------|
| `401` | No session or wrong `sessionKind` |
| `403` | Authenticated but no study access / insufficient study role |
| `404` | Unknown study slug |
| `409` | Duplicate slug or duplicate membership |

---

## 10. Prospectus review (v1.1.0)

System admins review submitted research prospectuses before new studies can be provisioned.

| UI | API |
|----|-----|
| `/system/admin/prospectus` — queue | `GET /api/system/prospectus` |
| `/system/admin/prospectus/:id` — detail | `GET /api/system/prospectus/:id` |
| Comment / request revision | `POST /api/system/prospectus/:id/reviews` |
| Dual approve / reject | `POST /api/system/prospectus/:id/approve` |
| Create draft study row | `POST /api/system/prospectus/:id/provision-study` |

**Dual approval roles:** `research_leadership` and `platform_ops` (both required). Full workflow: [research-prospectus.md](./research-prospectus.md).

Nav: prospectus link on system dashboard and `SystemAdminLayout` sidebar.

---

## 11. Implementation checklist

- [x] `system_admins` table + bootstrap on startup
- [x] Session `sessionKind` field + type augmentation
- [x] `/api/system/auth/*` routes
- [x] `/api/system/studies` CRUD
- [x] `/api/system/studies/:slug/access` CRUD
- [x] `GET /api/studies` public directory
- [x] `requireStudyAccess` on study admin API routes
- [x] Hub shell in `telehealth-survey/src/platform/` with `SystemAdminContext` + protected routes
- [x] System admin pages (login, dashboard, studies, access, users, health)
- [x] Built-in smoke tests at `/api/system/health/run-tests`
- [x] Update `.env.example`
- [x] Prospectus review UI + `/api/system/prospectus/*`
- [ ] OpenAPI + codegen for all system routes

---

## 12. Change log

| Date | Change |
|------|--------|
| 2026-07-02 | Initial system admin design |
| 2026-07-02 | Study-scoped registration; IT-only study creation |
| 2026-07-03 | v1.0.0 implementation; health page; built-in smoke tests; `INITIAL_ADMIN_*` fallback |
| 2026-07-05 | v1.1.0 prospectus review queue and dual-approval UI |
